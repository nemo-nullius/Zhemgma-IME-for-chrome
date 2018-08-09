// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

//console.log(window.words_all);
//
PAGE_SIZE_MAX = 5;
COMPOSITION_TEXT_LEN_MAX = 4;

var ime_api = chrome.input.ime;
var context_id = -1;
var candidates_all = []; // all candidates
var cadidates_page = []; // candidates in one page
var double_quotation_flag = false // f “ T ”
var single_quotation_flag = false

var composition_flag = false; // a flag for the existance of composition window
var composition_text = ""; // compostion text in the composition box
var page_num = 1; // which page it is in the candidate box

var candidates_store = [] // an array to store all the candidates from 1 to 4

// to store the previous key to examine whether a sing shift is pressed
var prev_key = {"key":"","code":"","type":""};
var shift_status = false; // to determine wheter to input English or not

//candidates_all = ["a","b","c","d","e","f","g","h","i","j","k"];

console.log("Initializing IME");

ime_api.onFocus.addListener(function(context) {
  console.log('onFocus:' + context.contextID);
  context_id = context.contextID;
});
ime_api.onBlur.addListener(function(contextID) {
  context_id = -1;
});
ime_api.onActivate.addListener(function(engineID) {
  console.log('onActivate:' + engineID);
});
ime_api.onDeactivated.addListener(function(engineID) {
  console.log('onDeactivated:' + engineID);
});

function resetGlbVar(engineID, contextID){
          composition_text = "";
          composition_flag = false;
          candidates_store = [];
          page_num = 1;
          if (context_id != -1){
            ime_api.clearComposition({"contextID": context_id});
            ime_api.setCandidateWindowProperties({"engineID": engineID, "properties": {"visible": false}});
          }
}

ime_api.onKeyEvent.addListener(
function(engineID, keyData) {
  console.log("check key");
  console.log(prev_key);
  console.log(keyData);
  if ((prev_key.key == "Shift" && keyData.key == "Shift") && (prev_key.type == "keydown" && keyData.type == "keyup"))
  {// a single shift is pressed
      console.log("shift_status " + shift_status);
      shift_status = !shift_status;
  }

  prev_key["key"] = keyData.key;
  prev_key["type"] = keyData.type;
  prev_key["code"] = keyData.code;
  if (shift_status && keyData.key.match(/[\x20-\x7e]/)){
      // This is not needed: && !keyData.ctrlKey && !keyData.altKey
      console.log("shift_status, do nothing");
      ime_api.commitText({"contextID": context_id, "text": keyData.text});
      return true;
  }

  console.log("glb: " + window.glb_var);
  console.log('onKeyEvent:' + keyData.key + " context: " + context_id);
  console.log(keyData);
  // handle input
  //if (keyData.type == "keydown"){
  if (keyData.type == "keydown" && keyData.altKey == false && keyData.ctrlKey == false && 
      ((keyData.key.match(/^[a-z1-9`~!@#$%^&*()\-=_+\[\]|{}\\;':",.\/<>? ]$/) ||
      (keyData.key == "Shift") || ((keyData.key == "Backspace") & composition_flag )
      ))) {
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
      // get candidates_all
      var filtered_keys = function(obj, filter) {
          var key, keys = [];
              for (key in obj) {
                  if (obj.hasOwnProperty(key) && filter.test(key)) {
                        keys.push(key);
                  }
               }
          return keys;
      }
      // get candidates_all
      /* for dict words_all
      var keyRegex = "^"+composition_text+".{0,"+(4-composition_text.length).toString()+"}$";
      console.log(keyRegex);
      var candidates_all_keys = filtered_keys(window.words_all,new RegExp(keyRegex));
      console.log("candidates_all_keys");
      console.log(candidates_all_keys);
      var key = [];
      candidates_all = [];
      for (var i = 0; i<candidates_all_keys.length; i++) {
          candidates_all.push(window.words_all[candidates_all_keys[i]]);
      }
      */
      var keyRegex = new RegExp("^"+composition_text+".{0,"+(4-composition_text.length).toString()+"}$");
      if (candidates_store.length == 0){
          candidates_store.push(window.words_all.concat(window.phrases_all).concat(window.symbols_all));
      }
      candidates_all = [];
      for (var i=0; i<candidates_store[composition_text.length-1].length; i++){
          if (candidates_store[composition_text.length-1][i][0].match(keyRegex)){
              candidates_all.push(candidates_store[composition_text.length-1][i]);
          }
      }
     candidates_store.push(candidates_all);
      
      // get candidates_page, candidates_page_array
      //candidates_page_array = [ {"candidate":"a","id":1,"label":"1","annotation":"1st"}, {...}];
      candidates_page_array = [];
      candidates_page = [];
      page_limit = (page_num*PAGE_SIZE_MAX<candidates_all.length)? PAGE_SIZE_MAX : candidates_all.length - ((page_num-1)*PAGE_SIZE_MAX);
      for (var i = 0; i < page_limit; i++){
          console.log(i);
          console.log("page_limit: "+page_limit);
          candidates_page.push(candidates_all[(page_num-1)*PAGE_SIZE_MAX+i][1]);
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
    if (keyData.key == " "){ // force to commit
          if (candidates_page.length > 0 && composition_flag){ // the 1st candidate exists
            ime_api.commitText({"contextID": context_id, "text": candidates_page[0]});
          }
        resetGlbVar(engineID, context_id);
    }
    if (keyData.key.match(/^[`~!@#$%^&*()_+\[\]|{}\\;:,.\/<>?]$/)){
          if (candidates_page.length > 0 && composition_flag){ // the 1st candidate exists
            ime_api.commitText({"contextID": context_id, "text": candidates_page[0]});
          }
        resetGlbVar(engineID, context_id);
          ime_api.commitText({"contextID": context_id, "text": window.cn_annotations[keyData.key]});
    }
    if (keyData.key=='"'||keyData.key == "'"){
        if (keyData.key == '"'){
            output_quotation = (double_quotation_flag)? "”" : "“";
            double_quotation_flag = !double_quotation_flag;
        }else{
            output_quotation = (single_quotation_flag)? "’" : "‘";
            single_quotation_flag = !single_quotation_flag;
        }
         if (candidates_page.length > 0 && composition_flag){ // the 1st candidate exists
            ime_api.commitText({"contextID": context_id, "text": candidates_page[0]});
          }
        resetGlbVar(engineID, context_id);
          ime_api.commitText({"contextID": context_id, "text": output_quotation});
    }
    if (keyData.key.match(/^[1-9]$/)) {
        select_num = parseInt(keyData.key,10);
        if (composition_text){ //clear composition candidateWindow
          resetGlbVar(engineID, context_id);
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
              candidates_page.push(candidates_all[(page_num-1)*PAGE_SIZE_MAX+i][1]);
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
    if (keyData.key == "Backspace"){ // from the outest if, this if-statement will only work when Backspace && composition_flag == true
      if (composition_text.length > 1){
        console.log("composition_text: "+composition_text);
        console.log("candidates_store");
        console.log(candidates_store);
        //ime_api.deleteSurroundingText({"engineID":engineID,"contextID":context_id, "offset":1, "length":2});// length: len of the string to be deleted
        composition_text = composition_text.slice(0, composition_text.length-1);
        candidates_all = candidates_store[composition_text.length];
        candidates_store.pop();
        candidates_page_array = [];
        candidates_page = [];
        page_limit = (page_num*PAGE_SIZE_MAX<candidates_all.length)? PAGE_SIZE_MAX : candidates_all.length - ((page_num-1)*PAGE_SIZE_MAX);
        for (var i = 0; i < page_limit; i++){
            candidates_page.push(candidates_all[(page_num-1)*PAGE_SIZE_MAX+i][1]);
            candidates_page_array.push({"candidate":candidates_page[i],"id":i,"label":(i+1).toString()});
        }
      //ime_api.sendKeyEvents({"contextID": context_id, "keyData":[keyData]});
      ime_api.setCandidates({"contextID": context_id,
                             "candidates": candidates_page_array});
      ime_api.setComposition({"contextID": context_id,
                                "text": composition_text,
                                "cursor": composition_text.length});
      /*
      ime_api.setCandidateWindowProperties({"engineID": engineID,
                                           "properties": {
                                               "visible": true,
                                               "vertical": true,
                                               "cursorVisible": true,
                                               "pageSize": PAGE_SIZE_MAX}});
                                               */
      composition_flag = true;
    }else{
        resetGlbVar(engineID, context_id); // to del the composition window and reset all when all composition texts are deleted
    }
        console.log("del activated");
    }// Backspace

  return true;
  } // the outest if(keyData.type)
  else if(keyData.type=="keydown"){
      resetGlbVar(engineID, context_id);
      //ime_api.sendKeyEvents({"contextID": context_id, "keyData":[keyData]});
  }

  return false //last line, cannot delete
});
