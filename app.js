function parseHTML(html)
{
  return new DOMParser().parseFromString(html, 'text/html');
}

function load(url)
{
  return new Promise(function (resolve, reject) {
    fetch(url).then(response => {
      response.text().then(text => {
        resolve(parseHTML(text));
      }, () => reject());
    }, () => reject());
  });
}

function appendTemplatesToDocument(doc)
{
  doc.querySelectorAll('template').forEach(t => {
    document.body.appendChild(t);
  });
}

function toArray(obj)
{
  return Array.prototype.slice.call(obj);
}

function arrayToObject(key, arr)
{
  var obj = {};
  key.forEach((k, i) => {
    if(k) obj[k] = arr[i];
  });
  return obj;
}

function tableTo2DArray(table)
{
  return toArray(table.querySelectorAll('tr'))
    .map(tr => toArray(tr.querySelectorAll('td')).map(td => {
      td.innerHTML = td.innerHTML.replace(/<br>/ig, '\n');
      return td.textContent;
    }));
}

function parseSubmitFormData(contentDOM)
{
  return tableTo2DArray(contentDOM.querySelector('table'))
    .slice(CONFIG.skipRows)
    .map(row => arrayToObject(CONFIG.fields.map(f => f && f.name), row));
}

var vm;

function runApp()
{
  Vue.component('data-view', {
    template: '#data-view',
    props: {
      fields: {
        type: Array
      },
      data: {
        type: Object
      }
    }
  });

  Vue.component('data-field', {
    template: '#data-field',
    props: {
      data: {
        type: Object,
        default: () => {}
      },
      field: {
        type: Object,
        default: () => {}
      }
    }
  });

  vm = new Vue({
    el: '#app',
    template: '#t',
    data: function () {
      return {
        db: [],
        fields: CONFIG.fields,
        state: 'NOFILE'
      }
    },
    created: function () {
      if(CONFIG.dataFileName) {
        this.state = 'LOADING';
        load(CONFIG.dataFileName).then(doc => {
          this.db = parseSubmitFormData(doc);
        }).catch(() => { this.state = 'ERROR'; });
      }
    },
    watch: {
      db: function () {
        this.state = 'DONE'
      }
    }
  });
}

/*
load('template.html')
  .then(appendTemplatesToDocument)
  .then(runApp) */

runApp();

document.addEventListener('drop', e => { e.stopPropagation(); e.preventDefault();
  var file = e.dataTransfer.files[0];
  var reader = new FileReader();
  reader.addEventListener('loadend', e => {
    if(reader.readyState === FileReader.DONE) {
      if(vm) {
        vm.db = parseSubmitFormData(parseHTML(reader.result));
      }
    }
  });
  reader.readAsText(file, 'UTF-8')
}, false);

document.addEventListener('dragover', e => {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}, false);

// vim: et sw=2
