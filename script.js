const versions = [];

function handleFileSelect(which) {
  document.getElementById("messages").innerText = '';
  const input = document.getElementById('file-input-'+which);
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function() {
    try{
      versions[which] = JSON.parse(reader.result);
    } catch(e){
      document.getElementById("messages").innerText = 'Could not interpret your upload. Are you sure it is a JSON file?';
    }
  };
  reader.readAsText(file);
}

function compareVersions(previous, current){
  if (!versions['previous'] || Object.keys(versions['previous']).length === 0 || !versions['current'] || Object.keys(versions['current']).length === 0){
    document.getElementById("messages").innerText = 'Upload both previous and current version of the swagger.json before clicking "Compare versions"';
  }
  document.getElementById("messages").innerText = '';
  
  //converts the flat list of changes into a hierarchical list
  var changelog = {};
  DeepDiff.observableDiff(versions['previous'], versions['current'], function (d) {
    let branch = changelog;
    for(let i = 0; i < d['path'].length; i++){
      if(!branch[d.path[i]]){
        branch[d.path[i]] = {};
      }
      branch = branch[d.path[i]];
    }
    convertChangelogItem(d, branch);
  });

  //converts the hierarchical changelog list into HTML to display results as nested lists
  document.querySelector("#results").innerHTML = prettyPrintChangelog(changelog, [], 'root').join("\n");
  
  //adds behavior to toggle parts of the structure 
  const toEls = document.querySelectorAll('li.path span.toggle');
  for (const toEl of toEls) {
    toEl.classList.add('list-shown');
    toEl.addEventListener("click", toggleChildList, false);
  }
}

//creates the nodes in the hierarchical list detailing the actual changes
function convertChangelogItem(change, branch){
  switch (change['kind']){
    case 'N':
      branch['type'] = 'leaf';
      branch['title'] = 'Added to API';
      branch['status'] = 'added';
      branch['text'] = change['rhs'];
      break;
    case 'D':
      branch['type'] = 'leaf';
      branch['status'] = 'deleted';
      branch['title'] = 'Removed from API';
      branch['text'] = change['lhs'];
      break;    
    case 'E':
      branch['type'] = 'leaf';
      branch['status'] = 'changed';
      branch['title'] = 'Changed in API';
      branch['text'] = {
        previous: change['lhs'],
        current: change['rhs']
      }
      break; 
    case 'A':
      convertChangelogItem(change['item'], branch);
      break;       
  }
}

//builds the HTML for the nested lists
function prettyPrintChangelog(cl,html,parent){
  let keys = Object.keys(cl);
  
  // output for leaf nodes
  if (keys.includes('type') && cl['type'] == 'leaf'){
    html.push('<ul class="path change-container">');
    html.push('<li class="path change-container"><span class="changed-property">'+parent+'</span>');
    
    html.push('<ul class="leaf status-'+cl['status']+'">');
    html.push('<li class="title">'+cl['title']+'</li>');
    if (cl['status'] != 'changed'){
      html.push('<li class="text"><pre><code>'+JSON.stringify(cl['text'], undefined, ' ')+'</code></pre></li>');
    } else {
      html.push('<li class="text text-previous"><span>From</span><pre><code>'+JSON.stringify(cl['text']['previous'], undefined, ' ')+'</code></pre></li>');
      html.push('<li class="text text-current"><span>To</span><pre><code>'+JSON.stringify(cl['text']['current'], undefined, ' ')+'</code></pre></li>');
    }
    html.push('</ul></li></ul>');
  //output for structure nodes
  } else {
    html.push('<ul class="path">');
    html.push('<li class="path"><span class="toggle">'+parent+'</span>');

    // TODO: create links to documentation for relevant elements...
    if(parent && parent.startsWith('/')){
      html.push('<a href="'+ getDocumentationLink(parent) +'" class="doc-link" target="_blank">⇗</a>');
    }
    
    keys.forEach(function(k){
      html.push(prettyPrintChangelog(cl[k], html, k));
    });
    
    html.push('</li>');
    html.push('</ul>');
  }
  return html;
}

function getDocumentationLink(){
  return '#'
}

// Toggle element visibility
function toggleChildList(e) {
  e.stopImmediatePropagation();

  const toEl = e.target;
  const lists = toEl.closest('ul.path').querySelectorAll('ul.path');
  
  if(toEl.classList.contains('list-shown')){
    toEl.classList.remove('list-shown');
	  toEl.classList.add('list-hidden');  
	  lists.forEach(function(l){
	    l.style.display = 'none';
	  });
  } else {
    toEl.classList.add('list-shown');
	  toEl.classList.remove('list-hidden');    
	  lists.forEach(function(l){
	    l.style.display = 'block';
	  });
  }
};
