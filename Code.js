/**
 * PlantUML Gizmo project - (c) 2014-26 Christopher Fuhrman 
 * fuhrmanator@gmail.com
 */

/**
 * Limit the access to 
 * @OnlyCurrentDoc
 * By default, it asks for access to all Google Docs
 */

// TODO find a way to do Google Analytics properly - currently, it logs IPs of Google Servers as the GA script runs inside a server

var ADD_ON_TITLE = 'PlantUML Gizmo';

/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
  var ui = getUi();
  ui.createAddonMenu()
      .addItem('Start', 'showSidebar')
      .addSeparator()
      .addItem('About', 'showAbout')
      .addItem('Settings', 'showSettings')
      .addToUi();
}

/**
 * Runs when the add-on is installed.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 */
function showSidebar() {
  var ui = HtmlService.createTemplateFromFile('Sidebar')
      .evaluate()
      .setTitle(ADD_ON_TITLE);

  getUi().showSidebar(ui); // Updated
}

/**
 * Re-opens (after preferences dialog) sidebar
 */
function reshowSidebar() {
  var ui = HtmlService.createTemplateFromFile('Sidebar')
      .evaluate()
      .setTitle(ADD_ON_TITLE);

  getUi().showSidebar(ui);  
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 */
function showSettings() {
  var ui = HtmlService.createTemplateFromFile('Settings')
      .evaluate()
      .setWidth(500)
      .setHeight(315);
  
  // Use showModalDialog instead of showDialog
  getUi().showModalDialog(ui, 'PlantUML Gizmo Settings');
}

/**
 * Opens a dialog showing information about the Add-on
 */
function showAbout() {
  var ui = getUi();

  var result = ui.alert(
    'About',
    'PlantUML Gizmo was written for use in the OO Analysis and Design courses at École de technologie supérieure, and has been used by Google Engineers on Android and Google Pay.\n\nIt uses JavaScript API Client Code described at https://plantuml.com/code-javascript-asynchronous as well as inflating routines at http://www.planttext.com/javascript/jquery-plantuml/plantuml.js \n\n(2026-06-20)',
    ui.ButtonSet.OK);
}

/**
 * Save PlantUML source text (from sidebar)
 */
function saveSource(source) {
  // console.log("Saving source " + source );  
  var properties = PropertiesService.getUserProperties();  // User properties hold source code, since collaborators could conceivably modify the same Document
  var result = properties.setProperty("PlantUMLSource", source);
  // console.log("Result = " + result );
}

/**
 * Load PlantUML source text (from sidebar)
 */
function loadSource() {
  // console.log("Loading source");  
  var properties = PropertiesService.getUserProperties();
  var source = properties.getProperty("PlantUMLSource");
  // console.log("source = " + source );
  if (!source) {
    source = "Bob -> Alice : hello";
  }
  return source;
}

/**
 * Save PlantUML source text (from sidebar)
 */
function clearSource() {
  // console.log("Clearing source");
  var properties = PropertiesService.getUserProperties();
  properties.deleteProperty("PlantUMLSource");
}

/**
 * Gets the prefs
 */
function getPrefs() {
  var serverUrl = "";
  var useDataUrl = false;
  var useDataUrlProperty;
  var theProperties = PropertiesService.getDocumentProperties();
  
  serverUrl = theProperties.getProperty('PLANTUML_SERVER_URL');
  if ( serverUrl === null ) {
    // initialize the property to default
    theProperties.setProperty('PLANTUML_SERVER_URL', 'https://www.plantuml.com/plantuml/');
    serverUrl = theProperties.getProperty('PLANTUML_SERVER_URL');
  }
  
  useDataUrlProperty = theProperties.getProperty('PLANTUML_SERVER_USE_DATA_URL');
  if ( useDataUrlProperty === null ) {
    // initialize the property to default
    theProperties.setProperty('PLANTUML_SERVER_USE_DATA_URL', false);
  }
  useDataUrl = theProperties.getProperty('PLANTUML_SERVER_USE_DATA_URL') == "true";
  
  var prefs = {serverPrefix:serverUrl,
               useDataURL:useDataUrl};
  
  return prefs;
}

/**
 * Sets the prefs
 */
function setPrefs(prefs) {
//  console.log("setting prefs: " + prefs.serverPrefix + ", useDataURL=" + prefs.useDataURL + " (type is " + typeof prefs.useDataURL + ")");
  // TODO verify it's a valid URL - try to get an image? -- maybe try this in the JavaScript settings first
  var theProperties = PropertiesService.getDocumentProperties();
  theProperties.setProperty('PLANTUML_SERVER_URL', prefs.serverPrefix);
  theProperties.setProperty('PLANTUML_SERVER_USE_DATA_URL', prefs.useDataURL);
  return prefs;
}

/**
 * Recovers URL from selected image (Main Dispatcher)
 */
function recoverUrlFromImage() {
  if (isDocs()) {
    return recoverUrlFromImageDocs();
  } else {
    return recoverUrlFromImageSlides();
  }
}

function recoverUrlFromImageDocs() {
  var selection = DocumentApp.getActiveDocument().getSelection();
  if (selection) {
    var elements = selection.getRangeElements(); 
    if (elements.length == 1 &&
        elements[0].getElement().getType() == DocumentApp.ElementType.INLINE_IMAGE) {
      var url = elements[0].getElement().asInlineImage().getLinkUrl();
      if (!url) throwInvalidImageError();
      return url;
    }
    throw "Must select a PlantUML diagram.";
  }
  throwNoSelectionError();
}

function recoverUrlFromImageSlides() {
  var selection = SlidesApp.getActivePresentation().getSelection();
  if (selection && selection.getSelectionType() == SlidesApp.SelectionType.PAGE_ELEMENT) {
    var elements = selection.getPageElementRange().getPageElements();
    if (elements.length == 1 && elements[0].getPageElementType() == SlidesApp.PageElementType.IMAGE) {
      var url = elements[0].asImage().getLink().getUrl();
      if (!url) throwInvalidImageError();
      return url;
    }
    throw "Must select a PlantUML diagram.";
  }
  throwNoSelectionError();
}

function throwInvalidImageError() {
  throw 'Invalid image - must have a PlantUML URL linked to it. See this <a href="https://sites.google.com/site/plantumlgizmo/learn#TOC-Can-I-update-the-source-of-PlantUML-diagrams-">FAQ</a>.';
}

function throwNoSelectionError() {
  throw 'Must select an image that was inserted with PlantUML Gizmo. See this <a href="https://sites.google.com/site/plantumlgizmo/learn#TOC-Can-I-update-the-source-of-PlantUML-diagrams-">FAQ</a>.';
}

/**
 * Inserts or Replaces an Image (Main Dispatcher)
 */
function insertImage(imageDataUrl, imageUrl) {
  var blob = (imageDataUrl !== "") ? getBlobFromBase64(imageDataUrl) : getBlobViaFetch(imageUrl);

  if (isDocs()) {
    insertImageDocs(blob, imageUrl);
  } else {
    insertImageSlides(blob, imageUrl);
  }
}

function insertImageDocs(blob, imageUrl) {
  var doc = DocumentApp.getActiveDocument();
  var selection = doc.getSelection();
  var replaced = false;

  if (selection) {
    var elements = selection.getRangeElements();
    if (elements.length == 1 && elements[0].getElement().getType() == DocumentApp.ElementType.INLINE_IMAGE) {
      var parentElement = elements[0].getElement().getParent();
      elements[0].getElement().removeFromParent();
      replaced = true;
      doc.setCursor(doc.newPosition(parentElement, 0));
    } else {
      throw "Please select only one image (image replacement) or nothing (image insertion)";
    }
  }

  var cursor = doc.getCursor();
  var image = cursor.insertInlineImage(blob);
  image.setLinkUrl(imageUrl);

  // Resize logic for Docs
  if (cursor.getElement().getType() == DocumentApp.ElementType.PARAGRAPH) {
    var currentParagraph = cursor.getElement().asParagraph();
    var originalWidth = image.getWidth();
    var body = doc.getBody();
    var pageWidth = body.getPageWidth() - body.getMarginLeft() - body.getMarginRight();
    var paragraphWidth = (pageWidth - currentParagraph.getIndentStart() - currentParagraph.getIndentEnd()) * 96 / 72;

    if (originalWidth > paragraphWidth) {
      image.setWidth(paragraphWidth);
      image.setHeight(image.getHeight() * (paragraphWidth / originalWidth));
    }
  }

  if (selection) {
    doc.setSelection(doc.newRange().addElement(image).build());
  }
}

function insertImageSlides(blob, imageUrl) {
  var presentation = SlidesApp.getActivePresentation();
  var selection = presentation.getSelection();
  var currentPage = selection.getCurrentPage();
  
  if (currentPage.getPageType() != SlidesApp.PageType.SLIDE) {
    throw "Inserting only works in a Slide view.";
  }

  var image = null;
  var replaced = false;

  if (selection.getSelectionType() == SlidesApp.SelectionType.PAGE_ELEMENT) {
    var elements = selection.getPageElementRange().getPageElements();
    if (elements.length == 1 && elements[0].getPageElementType() == SlidesApp.PageElementType.IMAGE) {
      replaced = true;
      image = elements[0].asImage();
    } else {
      throw "Please select only one image (image replacement) or nothing (image insertion)";
    }
  }

  if (replaced) {
    image.replace(blob);
  } else {
    image = currentPage.asSlide().insertImage(blob);
  }

  image.setLinkUrl(imageUrl);
  image.select();
}

function getBlobViaFetch(imageDataUrl) {
  // console.log("UrlFetchApp.fetch");
  var resp = UrlFetchApp.fetch(imageDataUrl);  // raw data
  // console.log("resp code: " + resp.getResponseCode());
  // console.log("fetch resp: " + resp.getContent());

  if (resp.getResponseCode() != 200) {
    throw "HTTPResponse returned code of " + resp.getResponseCode() + " for URL " + imageUrl;
  }
    
  // Inserts the image and sets its link
  var blob = resp.getBlob(); 
  //var blob = resp.getAs('image/png');
  if (blob == null) {
    throw "Blob is null ";
  }
  // console.log("blob content type: " + blob.getContentType());

  blob.setContentType('image/png');  // force it to be something it's not?

  // console.log("blob type: " + blob.getContentType() + ", bytes = '" + blob.getBytes() + "'");
  
  return blob;

}

function getBlobFromBase64(imageDataUrl) {
  var base64String = imageDataUrl.replace("data:image/png;base64,","");
  var blob = Utilities.newBlob(Utilities.base64Decode(base64String)); 
  blob.setContentType("image/png")
  if (blob == null) {
    throw "getBlobFromBase64: Blob is null ";
  }
//  console.log("getBlobFromBase64: blob type: " + blob.getContentType() + ", bytes = '" + blob.getBytes() + "'");  
  return blob;

}

function getUi() {
  try {
    return DocumentApp.getUi();
  } catch (err) {
    return SlidesApp.getUi();
  }
}

/**
 * Detects if the current environment is Google Docs
 */
function isDocs() {
  try {
    return DocumentApp.getActiveDocument() !== null;
  } catch (e) {
    return false;
  }
}

/**
 * Detects if the current environment is Google Slides
 */
function isSlides() {
  try {
    return SlidesApp.getActivePresentation() !== null;
  } catch (e) {
    return false;
  }
}
