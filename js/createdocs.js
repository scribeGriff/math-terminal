/* global DataTable: false */
/* jshint node: true, browser: true, esnext: true */
(function () {
  "use: strict";

  var tableDiv, dataKey, importedData, tableID, datatable, 
      helpNameDiv;

  var buildHtmlTable, addAllColumnHeaders, entrySelect;

  var _table_ = document.createElement('table'),
      _tr_ = document.createElement('tr'),
      _th_ = document.createElement('th'),
      _td_ = document.createElement('td'),
      _tbody_ = document.createElement('tbody');

  window.onload = function() {
    tableDiv = document.getElementById("documentdiv");
    helpNameDiv = document.getElementById("Name");
    // Fetch the external help files.
    fetch("../../data/help.json")
      .then(function(response) {
      return response.json();
    }).then(function(json) {
      importedData = json;
      if (importedData !== null) {
        tableDiv.appendChild(buildHtmlTable(importedData));
        tableID = document.getElementById("datatable");
        datatable = new DataTable(tableID, {
          pageSize: 10000,
          sort:  [true, true],
          filters: [true, 'select'],
          filterEmptySelect: 'All',
          filterSelectOptions: true,
          filterInputClass: 'input',
          filterSelectClass: 'select'
        });
        document.title = "Documentation for the Math Console at Convo.lv";
        document.getElementById("title").innerHTML = "Console Docs";
        tableDiv.addEventListener('click', entrySelect, false);
        helpNameDiv.innerHTML = importedData[0].Name;
      }
      else {
        // Need to deal with this.
        console.log(json);
      }
    }, function(error) {
      // Need to catch this.
    }).catch(function(ex) {
      // need to catch this.
    });
  };

  entrySelect = function entrySelect(element) {
    element.preventDefault();
    if (element.target.tagName.toUpperCase() === "A") {
      console.log(element.target.innerHTML);
      var indexSelected = importedData.findIndex(x => x.Name == element.target.innerHTML);
      console.log(importedData[indexSelected].Description);
    }
  };

  buildHtmlTable = function buildHtmlTable(arr) {
    var _helpOrder = ["Name", "Category"];
    var cellValue, tr, td, anchor, link;
    var table = _table_.cloneNode(false),
        tbody = _tbody_.cloneNode(false),
        columns = addAllColumnHeaders(_helpOrder, table);
    for (var i = 0, maxi = arr.length; i < maxi; ++i) {
      tr = _tr_.cloneNode(false);
      for (var j = 0, maxj = columns.length; j < maxj ; ++j) {
        td = _td_.cloneNode(false);
        cellValue = arr[i][columns[j]];
        if (j === 0) {
          anchor = document.createElement("A");
          link = document.createTextNode(cellValue);
          anchor.setAttribute("href", "#");
          anchor.appendChild(link);
          td.appendChild(anchor);
        } else {
          td.appendChild(document.createTextNode(cellValue || ''));
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    table.id = "datatable";
    table.classList.add("table", "is-bordered", "is-striped", "is-narrow");
    return table;
  };

  // Adds a header row to the table.
  addAllColumnHeaders = function addAllColumnHeaders(arr, table) {
    var th, tr = _tr_.cloneNode(false),
        header = table.createTHead();
    for (var i = 0, l = arr.length; i < l; i++) {
      th = _th_.cloneNode(false);
      th.appendChild(document.createTextNode(arr[i]));
      tr.appendChild(th);
    }
    header.appendChild(tr);
    return arr;
  };
}());