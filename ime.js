// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

PAGE_SIZE_MAX = 5;
COMPOSITION_TEXT_LEN_MAX = 4;

var ime_api = chrome.input.ime;
var context_id = -1;
var candidates_all = []; // all candidates
var cadidates_page = []; // candidates in one page

var composition_flag = false; // a flag for the existance of composition window
var composition_text = ""; // compostion text in the composition box
var page_num = 1; // which page it is in the candidate box

candidates_all = ["a","b","c","d","e","f","g","h","i","j","k"];

console.log("Initializing IME");

ime_api.onFocus.addListener(function(context) {
  console.log('onFocus:' + context.contextID);
  context_id = context.contextID;
});
ime_api.onBlur.addListener(function(contextID) {
  console.log('onBlur:' + contextID);
  context_id = -1;
});
ime_api.onActivate.addListener(function(engineID) {
  console.log('onActivate:' + engineID);
});
ime_api.onDeactivated.addListener(function(engineID) {
  console.log('onDeactivated:' + engineID);
});

ime_api.onKeyEvent.addListener(
function(engineID, keyData) {
  console.log('onKeyEvent:' + keyData.key + " context: " + context_id);
  // handle input
  if (keyData.type == "keydown"){
  if (keyData.key.match(/^[a-z,0-9,\-=]$/)) {
    // input chars
    if (keyData.key.match(/^[a-z]$/)) {
      if (composition_text.length >= COMPOSITION_TEXT_LEN_MAX){ // force to commit
          composition_text = keyData.key;
          ime_api.clearComposition({"contextID": context_id});
          ime_api.setCandidateWindowProperties({"engineID": engineID, "properties": {"visible": false}});
          composition_flag = false;
          page_num = 1;
          if (candidates_page.length > 0){ // the 1st candidate exists
            ime_api.commitText({"contextID": context_id, "text": candidates_page[0]});
          }
      }else{
        composition_text += keyData.key;
      }
      ime_api.setComposition({"contextID": context_id,
                                "text": composition_text,
                                "cursor": composition_text.length});
      ime_api.setCandidateWindowProperties({"engineID": engineID,
                                           "properties": {
                                               "visible": true,
                                               "vertical": true,
                                               "cursorVisible": true,
                                               "pageSize": PAGE_SIZE_MAX}});
      composition_flag = true;
      // get candidates_page, candidates_page_array
      //candidates_page_array = [ {"candidate":"a","id":1,"label":"1","annotation":"1st"}, {...}];
      candidates_page_array = [];
      candidates_page = [];
      page_limit = (page_num*PAGE_SIZE_MAX<candidates_all.length)? PAGE_SIZE_MAX : candidates_all.length - ((page_num-1)*PAGE_SIZE_MAX)
      for (var i = 0; i < page_limit; i++){
          console.log(i);
          console.log("page_limit: "+page_limit);
          candidates_page.push(candidates_all[(page_num-1)*PAGE_SIZE_MAX+i]);
          candidates_page_array.push({"candidate":candidates_page[i],"id":i,"label":(i+1).toString()});
          console.log("candidates_page");
          console.log(candidates_page);
          console.log("candidates_page_array");
          console.log(candidates_page_array);
      }

      ime_api.setCandidates({"contextID": context_id,
                             "candidates": candidates_page_array});
     } // match(/^[a-z]$/)

    //commit
    if (keyData.key.match(/^[1-9]$/)) {
        select_num = parseInt(keyData.key,10);
        if (composition_text){
          ime_api.clearComposition({"contextID": context_id});
          ime_api.setCandidateWindowProperties({"engineID": engineID, "properties": {"visible": false}});
          composition_flag = false;
          page_num = 1;
          composition_text = "";
          if (select_num <= candidates_page.length){ // select the candidates
            console.log("entering select section");
            ime_api.commitText({"contextID": context_id,
                                       "text": candidates_page[select_num-1]});
          }else{ // number not in the selection range
            ime_api.commitText({"contextID": context_id, "text": keyData.key});
          }
          return true;
        }else{ //not selection, just output the number
          ime_api.commitText({"contextID": context_id,
                                   "text": keyData.key});
        }
    }
    //page
    if (keyData.key.match(/^[\-=]$/)) {
        if (composition_flag){
          console.log("entering page section");
          candidates_page_array = [];
          candidates_page = [];
          if (keyData.key == "-"){
               if (page_num <= 1) {
                   page_num = 1;
               }else{
                   page_num -= 1;
               }
           }else if (keyData.key=="="){
               page_max = Math.ceil(candidates_all.length/PAGE_SIZE_MAX);
               if (page_num < page_max){
                   page_num += 1;
               }else{
                   page_num = page_max;
               }
           }
          page_limit = (page_num*PAGE_SIZE_MAX<candidates_all.length)? PAGE_SIZE_MAX : candidates_all.length - ((page_num-1)*PAGE_SIZE_MAX)
          for (var i = 0; i < page_limit; i++){
              console.log(i);
              console.log("page_limit: "+page_limit);
              candidates_page.push(candidates_all[(page_num-1)*PAGE_SIZE_MAX+i]);
              candidates_page_array.push({"candidate":candidates_page[i],"id":i,"label":(i+1).toString()});
              console.log("candidates_page");
              console.log(candidates_page);
              console.log("candidates_page_array");
              console.log(candidates_page_array);
              ime_api.setCandidates({"contextID": context_id,
                                     "candidates": candidates_page_array});
          }
        }else{ //not page, just output +-
          ime_api.commitText({"contextID": context_id,
                                   "text": keyData.key});
        }
    }// page

  }/*else if (keyData.key.match(/[ `~!@#$%^&*()-=_+\[\]\\{}|;':",./<>?]/)){ 
      ime_api.commitText({"contextID": context_id,
                               "text": keyData.key});
      composition_text = "";
      ime_api.setCandidateWindowProperties({"engineID": engineID, "properties": {"visible": false}});
      composition_flag = false;
      page_num = 1;
  }
  */
  return true;
  } // the outest if(keyData.type)

  return false //last line, cannot delete
});
