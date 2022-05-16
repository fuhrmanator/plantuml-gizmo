/**
 * PlantUML Gizmo project - (c) 2014 Christopher Fuhrman 
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
  DocumentApp.getUi().createAddonMenu()
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
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)  // https://developers.google.com/apps-script/migration/iframe?utm_campaign=app+invites_deprication_google_apps_script_101315&utm_source=gdev&utm_medium=blog#setting_the_link_target_attribute
      .setTitle(ADD_ON_TITLE)

  DocumentApp.getUi().showSidebar(ui);

// code past here doesn't seem to run (filtered by CAJA, or showSidebar() never returns?)  
//  Logger.log("checking selection");
//  // load source of image if it's selected
//  var selection = DocumentApp.getActiveDocument().getSelection();
//  if (selection) {
//    recoverUrlFromImage();
//  } else {
//    Logger.log("No image selected");
//  }
//  


}

/**
 * Re-opens (after preferences dialog) sidebar
 */
function reshowSidebar() {
  var ui = HtmlService.createTemplateFromFile('Sidebar')
      .evaluate()
      .setTitle(ADD_ON_TITLE)

  DocumentApp.getUi().showSidebar(ui);  
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 */
function showSettings() {
  var ui = HtmlService.createTemplateFromFile('Settings')
      .evaluate()
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle('PlantUML Gizmo Settings')
      .setWidth(500)
      .setHeight(315);
  DocumentApp.getUi().showDialog(ui);  // does this call block???
  return;
}


/**
 * Opens a dialog showing information about the Add-on
 */
function showAbout() {
  var ui = DocumentApp.getUi();

  var result = ui.alert(
    'About',
    'PlantUML Gizmo was written for use in the OO Analysis and Design courses at École de technologie supérieure, and has been used by Google Engineers on Android and Google Pay.\n\nIt uses JavaScript API Client Code described at http://plantuml.sourceforge.net/codejavascript.html as well as inflating routines at http://www.planttext.com/javascript/jquery-plantuml/plantuml.js \n\nFind me on twitter @thefuhrmanator. Version 15 (2019-11-22)',
    ui.ButtonSet.OK);
}

/**
 * Save PlantUML source text (from sidebar)
 */
function saveSource(source) {
  // Logger.log("Saving source " + source );  
  var properties = PropertiesService.getUserProperties();  // User properties hold source code, since collaborators could conceivably modify the same Document
  var result = properties.setProperty("PlantUMLSource", source);
  // Logger.log("Result = " + result );
}

/**
 * Load PlantUML source text (from sidebar)
 */
function loadSource() {
  // Logger.log("Loading source");  
  var properties = PropertiesService.getUserProperties();
  var source = properties.getProperty("PlantUMLSource");
  // Logger.log("source = " + source );
  if (!source) {
    source = "Bob -> Alice : hello";
  }
  return source;
}

/**
 * Save PlantUML source text (from sidebar)
 */
function clearSource() {
  // Logger.log("Clearing source");
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
//  Logger.log("setting prefs: " + prefs.serverPrefix + ", useDataURL=" + prefs.useDataURL + " (type is " + typeof prefs.useDataURL + ")");
  // TODO verify it's a valid URL - try to get an image? -- maybe try this in the JavaScript settings first
  var theProperties = PropertiesService.getDocumentProperties();
  theProperties.setProperty('PLANTUML_SERVER_URL', prefs.serverPrefix);
  theProperties.setProperty('PLANTUML_SERVER_USE_DATA_URL', prefs.useDataURL);
  return prefs;
}

/**
 * Recovers URL from selected image
 */
function recoverUrlFromImage() {
  var selection = DocumentApp.getActiveDocument().getSelection();
  var url = "not set";
  if (selection) {
    /* make sure selection is an image */
    var elements = selection.getSelectedElements();
//    Logger.log("selection = " + selection);
    if (elements.length == 1 &&
        elements[0].getElement().getType() ==
        DocumentApp.ElementType.INLINE_IMAGE) {
          url = elements[0].getElement().asInlineImage().getLinkUrl();
          if (!url) {
            throw 'Invalid image - must have a PlantUML URL linked to it. See this <a href="https://sites.google.com/site/plantumlgizmo/learn#TOC-Can-I-update-the-source-of-PlantUML-diagrams-">FAQ</a>.';
          }
//          Logger.log("recoveredURL = " + url);
        } else {
          throw "Must select a PlantUML diagram.";
        }
  } else {
    throw 'Must select an image that was inserted with PlantUML Gizmo. See this <a href="https://sites.google.com/site/plantumlgizmo/learn#TOC-Can-I-update-the-source-of-PlantUML-diagrams-">FAQ</a>.';
  }
  return url;
}
/**
 * Inserts an Image at the selection
 *
 * @param {string} imageUrl The image URL to insert.
 */
function insertImage(imageDataUrl, imageUrl) {
//  imageDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAjCAIAAAB6jJ8NAAAANXRFWHRjb3B5bGVmdABHZW5lcmF0ZWQgYnkgaHR0cDovL3BsYW50dW1sLnNvdXJjZWZvcmdlLm5ldDpnVRsAAADXelRYdHBsYW50dW1sAAB4nC2NQWuDQBhE7wv+hznqwaCrpsVDCQkhISiEmqTHsupCluhu2P3Wtv++VnqZw8wb3saRsOTHIWDuofRTWDHC0c8g57Sq+586MRcZx5fq6R4wgfgNLUp0AdtI3S8QOw9C07WuMEnrlNF4TRIefsgeJz+AZ0jXZZGXWY7rZQeepHnEwsO5gjPedhK9+lO2nuZvxE5iEuGljtDs8e41qVFirydljR6lpmXH0VDzNLRw6zzeKkIj7ezHrWbp6mWVfPIibtOCVUr7718MmUnBsuCmqAAAAYtJREFUeNpj+A8G+52S9zvF4kVp/5HAfqcEQuqTISoZ4Bb8+3cOD8K0gJD6UQsQFjx+vOP58900tGD58o4tWyaRYMG1a+vKyxNSUgJPn15KpAVxcT6ZmaFTplQQZcGfP2fWretduLA5IcGPSAuWLm0DMiIi3ImyoLEx8+TJxd++nYiJ8SLSgg0b+oEMoD+IsmDx4paampS6ujTiLQgMdJw0qRwYsMRG8q9fp0lNpsCAHc1oFFqQst8pDh9yzkC1IJGQ+lQUC9DAy/1n/5MC8KjHbsHl+lkkWYBH/QBZQEUwQBY8WX+AJFPwqB+gOLjZv5wkC/CoHxyRvG/fvt27d9Mqkvv7+48cOXLz5k1aRXJKSgr1I/ne/M1w9s6dO5uammbOnInHAmT15MTBXzCAc4+GVNzoXvL78zda5WRggKxkttimEXrYv+T10YvkWHAqpfVK4xxcaJ9D5goGMwhaxWq1XS/qzqz11MzJQFmg0StZLLdphj1YtJXSSMYEwDg4ElT++eYDqkXyoC6uAXsM0J5rp8HfAAAAAElFTkSuQmCC"; // hack for a test
  /*
   * For debugging cursor info
   */
//  var cursor = DocumentApp.getActiveDocument().getCursor();
//  Logger.log(cursor.getElement().getParent().getType());
//  throw "cursor info: " + cursor.getElement().getType() + " offset = " + cursor.getOffset() + " surrounding text = '" + cursor.getSurroundingText().getText() + "'  parent's type = " + 
//    cursor.getElement().getParent().getType();

  /*
   * end debug
   */
//  Logger.log("insertImage got imageDataURL of '" + imageDataUrl + "'");
//  Logger.log("insertImage got imageURL of '" + imageUrl + "'");
  var doc = DocumentApp.getActiveDocument();
  var selection = doc.getSelection();
  var replaced = false;
  //Logger.log("insertImage()");
  /// TODO handle replacement cases
  if (selection) {
    var elements = selection.getSelectedElements();
    // delete the selected image (to be replaced)
    if (elements.length == 1 &&
        elements[0].getElement().getType() ==
        DocumentApp.ElementType.INLINE_IMAGE) {
          var parentElement = elements[0].getElement().getParent();  // so we can re-insert cursor
          elements[0].getElement().removeFromParent();
          replaced = true;
          // move cursor to just before deleted image
          doc.setCursor(DocumentApp.getActiveDocument().newPosition(parentElement, 0));
     } else {
          throw "Please select only one image (image replacement) or nothing (image insertion)"
     }
  }
  var cursor = doc.getCursor();
  var blob;

  if (imageDataUrl != "") {
    blob = getBlobFromBase64(imageDataUrl);
  } else {
    blob = getBlobViaFetch(imageUrl);
  }
    
  var image = cursor.insertInlineImage(blob);  

  image.setLinkUrl(imageUrl);


  // move the cursor to after the image
  var position = doc.newPosition(cursor.getElement(), cursor.getOffset()+1);
  doc.setCursor(position);

  // resize to width  
  if (cursor.getElement().getType() == DocumentApp.ElementType.PARAGRAPH) {
//    Logger.log("Resizing");
    var currentParagraph = DocumentApp.getActiveDocument().getCursor().getElement().asParagraph();
    var originalImageWidth = image.getWidth();  // pixels
    var documentWidthPoints = DocumentApp.getActiveDocument().getBody().getPageWidth() - DocumentApp.getActiveDocument().getBody().getMarginLeft() - DocumentApp.getActiveDocument().getBody().getMarginRight();
    var documentWidth = documentWidthPoints * 96 / 72;  // convert to pixels (a guess)
    var paragraphWidthPoints = documentWidthPoints - currentParagraph.getIndentStart() - currentParagraph.getIndentEnd();
    var paragraphWidth = paragraphWidthPoints * 96 / 72;  // convert to pixels (a guess)
  
    if (originalImageWidth > paragraphWidth) {
      image.setWidth(paragraphWidth);
      // scale proportionally
      image.setHeight(image.getHeight() * image.getWidth() / originalImageWidth);  
    }

  }
  
  // re-select inserted image
  if (selection) {
    var rangeBuilder = doc.newRange().addElement(image);
    doc.setSelection(rangeBuilder.build());
  }
}

function getBlobViaFetch(imageDataUrl) {
//  Logger.log("UrlFetchApp.fetch");
  var resp = UrlFetchApp.fetch(imageDataUrl);  // raw data
//  Logger.log("resp code: " + resp.getResponseCode());
//  Logger.log("fetch resp: " + resp.getContent());

  if (resp.getResponseCode() != 200) {
    throw "HTTPResponse returned code of " + resp.getResponseCode() + " for URL " + imageUrl;
  }
    
  // Inserts the image and sets its link
  var blob = resp.getBlob(); 
  //var blob = resp.getAs('image/png');
  if (blob == null) {
    throw "Blob is null ";
  }
  blob.setContentType('image/png');  // since it's null

//  Logger.log("blob type: " + blob.getContentType() + ", bytes = '" + blob.getBytes() + "'");
  
  return blob;

}

function getBlobFromBase64(imageDataUrl) {
  var base64String = imageDataUrl.replace("data:image/png;base64,","");
  var blob = Utilities.newBlob(Utilities.base64Decode(base64String)); 
  blob.setContentType("image/png")
  if (blob == null) {
    throw "getBlobFromBase64: Blob is null ";
  }
//  Logger.log("getBlobFromBase64: blob type: " + blob.getContentType() + ", bytes = '" + blob.getBytes() + "'");  
  return blob;

}
