// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

/**
 * @param {string} searchTerm - Search term for Google Image search.
 * @param {function(string,number,number)} callback - Called when an image has
 *   been found. The callback gets the URL, width and height of the image.
 * @param {function(string)} errorCallback - Called when the image is not found.
 *   The callback gets a string that describes the failure reason.
 */
// function getImageUrl(searchTerm, callback, errorCallback) {
//   // Google image search - 100 searches per day.
//   // https://developers.google.com/image-search/
//   var searchUrl = 'https://ajax.googleapis.com/ajax/services/search/images' +
//     '?v=1.0&q=' + encodeURIComponent(searchTerm);
//   var x = new XMLHttpRequest();
//   x.open('GET', searchUrl);
//   // The Google image search API responds with JSON, so let Chrome parse it.
//   x.responseType = 'json';
//   x.onload = function() {
//     // Parse and process the response from Google Image Search.
//     var response = x.response;
//     if (!response || !response.responseData || !response.responseData.results ||
//         response.responseData.results.length === 0) {
//       errorCallback('No response from Google Image search!');
//       return;
//     }
//     var firstResult = response.responseData.results[0];
//     // Take the thumbnail instead of the full image to get an approximately
//     // consistent image size.
//     var imageUrl = firstResult.tbUrl;
//     var width = parseInt(firstResult.tbWidth);
//     var height = parseInt(firstResult.tbHeight);
//     console.assert(
//         typeof imageUrl == 'string' && !isNaN(width) && !isNaN(height),
//         'Unexpected respose from the Google Image Search API!');
//     callback(imageUrl, width, height);
//   };
//   x.onerror = function() {
//     errorCallback('Network error.');
//   };
//   x.send();
// }
//
function createLink(tab, groupId) {
  //takes a tab object and create a link to switch to current tab
  // update current tab chrome.tabs.update(window.tabs[i].id, {active: true});
  b = document.createElement('button')
  b.classList.add('btn')
  b.id = tab.id

  const text = document.createElement('div')
  text.className ='tabTitle'
  text.textContent = tab.title
  b.appendChild(text)

  if(tab.highlighted) {
    b.classList.add('highlighted')
    b.disabled = true
  }else{
    const deleteBtn = document.createElement('div')
    deleteBtn.className = 'delete-btn' 
    deleteBtn.innerHTML = 'X'
    deleteBtn.addEventListener('click', deleteTab)
    b.appendChild(deleteBtn)
  }
  b.addEventListener('click',updateTab) //everything else
  renderStatus(b, groupId) //send id for click handling
}

function updateTab(e) {
  id = e.target.id || e.target.parentNode.id
  chrome.tabs.update(parseInt(id), {active: true}, function(tab){
    console.log('switch to new tab')
  })
}

function deleteTab(e) {
  e.stopPropagation()
  const id = e.target.id || e.target.parentNode.id
  const listItemId = document.querySelector('li.active').id
  const groupId = sortedGroupKeys[listItemId.split('_')[1]]
  let title = document.getElementById(id).children[1].textContent
  if (title.length > 25) {
    title = title.substring(0, 24) + "..."
  }
  const r = confirm(`Are you sure to delete this tab? ${title}`)
  if(r == true) {
    chrome.tabs.remove(parseInt(id), function(tab) {
      document.getElementById(id).remove()
      groups[groupId].map((tab, idx) => {
        if (tab.id === parseInt(id)) {
          groups[groupId].splice(idx, 1)
        }
      })
      if (!groups[groupId].length) {
        delete groups[groupId]
        document.getElementById(listItemId).remove()
        // move to current window
        document.getElementsByTagName('li')[0].click()
      }
    })
  }
}

function renderStatus(button, groupId) {
  let status
  if(!document.getElementById('status')) {
    status = document.createElement('div')
    status.className = 'status'
    status.id = 'status'
  }else {
    status = document.getElementById('status')
  }
  if(button.classList.contains('highlighted')) {
    status.insertBefore(button, status.firstChild)
  }else {
    status.appendChild(button)
  }
  const nav = document.getElementsByTagName('nav')[0]
  if(nav.parentNode.lastChild.id=='status') {
    nav.parentNode.lastChild.remove()
  }
  nav.parentNode.appendChild(status)
}


// document.addEventListener('DOMContentLoaded', function() {
//   getCurrentTabUrl(function(url) {
//
//     // Put the image URL in Google search.
//     // renderStatus('Performing Google Image search for ' + url);
//
//     // getImageUrl(url, function(imageUrl, width, height) {
//
//       // renderStatus('Search term: ' + url + '\n' +
//           'Google image search result: ' + imageUrl);
//       // var imageResult = document.getElementById('image-result');
//       // Explicitly set the width/height to minimize the number of reflows. For
//       // a single image, this does not matter, but if you're going to embed
//       // multiple external images in your page, then the absence of width/height
//       // attributes causes the popup to resize multiple times.
//       // imageResult.width = width;
//       // imageResult.height = height;
//       // imageResult.src = imageUrl;
//       // imageResult.hidden = false;
//
//     }, function(errorMessage) {
//       renderStatus('Cannot display image. ' + errorMessage);
//     });
//   });
// });

function getTabs(callback) {
  var queryInfo = {
    currentWindow: true
  }

  chrome.tabs.query(queryInfo, function(tabs) {
    //get all tabs in this window
    //i have permission tabs setted
    callback(tabs)
  })
}

let groups = {}
let sortedGroupKeys = {};
function groupTabs(tabs) {
  const regex = /^(?:https?:)?(?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/igm;
  tabs.map(tab => {
    let key
    if(!tab.favIconUrl) {
      key = 'others'
    }else {
      if (tab.url.indexOf('suspended.html') > -1 && tab.url.indexOf('chrome-extension://') > -1) {
        const url = new URL(tab.url.split('&uri=')[1])
        key = url.hostname
      }else if(tab.url.indexOf('localhost') > -1) {
        key = 'others'
      }else {
        const url = new URL(tab.url)
        key = url.hostname.split('.')[url.hostname.split('.').length - 2]
      }
    }
    if(key in groups) {
      groups[key].push(tab)
    }else {
      groups[key] = [tab] 
    }
  })
  return groups
}

function displayNavigation(groups) {
  const nav = document.createElement('nav')
  document.getElementById('mainBody').insertBefore(nav, document.getElementById('status'))
  const navList = document.createElement('ul')
  nav.appendChild(navList)
  let highlightedItem 
  let highlightedDomain
  Object.keys(groups).map((domain, idx) => {
    const navItem = document.createElement('li')
    const highlighted = groups[domain].filter(tab => tab.highlighted).length > 0;
    sortedGroupKeys[idx] = domain
    navItem.id = `N_${idx}`
    navItem.addEventListener('click', collapseGroup)
    navItem.innerHTML = `<img src='${groups[domain][0].favIconUrl || 'icon.png'}'>`
    if (highlighted) {
      highlightedItem = navItem
      highlightedDomain = domain
    }else {
      navList.appendChild(navItem)
    }
  })
  navList.insertBefore(highlightedItem, navList.firstChild)
  createHighlightTab(highlightedItem, navList, highlightedDomain)
}

function createHighlightTab(navItem, navList, domain) {
  navItem.classList.add('active')
  for (const tab of groups[domain]) {
    createLink(tab, navItem.id)
  }
  const domainElement = document.createElement('div')
  domainElement.className = 'domain'
  domainElement.textContent = domain
  document.getElementById('status').insertBefore(domainElement, document.getElementById('status').firstChild)
}

function collapseGroup(e) {
  document.getElementById('status').innerHTML = '';
  let key = e.target.id || e.target.parentNode.id
  const groupKey = sortedGroupKeys[key.split('_')[1]]
  // remove li that has active
  if (document.querySelector('li.active')) {
    document.querySelector('li.active').classList.remove('active')
  }
  // find the li item
  document.getElementById(key).classList.add('active')
  // highlight it
  createHighlightTab(document.getElementById(key), document.getElementsByTagName('ul')[0], groupKey)
}

document.addEventListener('DOMContentLoaded', function() {
  getTabs(function(tabs){
    groups = groupTabs(tabs)
    displayNavigation(groups)
  })

})

// ref
// function getCurrentTab(callback) {
//   // Query filter to be passed to chrome.tabs.query - see
//   // https://developer.chrome.com/extensions/tabs#method-query
//   var queryInfo = {
//     active: true,
//     currentWindow: true
//   };
//
//   chrome.tabs.query(queryInfo, function(tabs) {
//     // chrome.tabs.query invokes the callback with a list of tabs that match the
//     // query. When the popup is opened, there is certainly a window and at least
//     // one tab, so we can safely assume that |tabs| is a non-empty array.
//     // A window can only have one active tab at a time, so the array consists of
//     // exactly one tab.
//     var tab = tabs[0];
//
//     // A tab is a plain object that provides information about the tab.
//     // See https://developer.chrome.com/extensions/tabs#type-Tab
//     var url = tabs
//
//     // tab.url is only available if the "activeTab" permission is declared.
//     // If you want to see the URL of other tabs (e.g. after removing active:true
//     // from |queryInfo|), then the "tabs" permission is required to see their
//     // "url" properties.
//     console.assert(typeof url == 'string', 'tab.url should be a string');
//
//     callback(urls);
//   });
//
//   // Most methods of the Chrome extension APIs are asynchronous. This means that
//   // you CANNOT do something like this:
//   //
//   // var url;
//   // chrome.tabs.query(queryInfo, function(tabs) {
//   //   url = tabs[0].url;
//   // });
//   // alert(url); // Shows "undefined", because chrome.tabs.query is async.
// }
