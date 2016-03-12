/* global DataTable: false */
/* jshint node: true, browser: true, esnext: true */
(function () {
  "use: strict";

  var tableDiv, dataKey, importedData, tableID, datatable, 
      pageNum, lastPageNum, keyString, termString, termName;

  var updatePageNumber, buildHtmlTable, addAllColumnHeaders;

  var _table_ = document.createElement('table'),
      _tr_ = document.createElement('tr'),
      _th_ = document.createElement('th'),
      _td_ = document.createElement('td'),
      _tbody_ = document.createElement('tbody');

  window.onload = function() {
    tableDiv = document.getElementById("documentdiv");
    pageNum = document.getElementById("pagenumber");
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
          pageSize: 20,
          sort: '*'
        });
        document.title = "Documentation for the Math Console at Convo.lv";
        document.getElementById("title").innerHTML = "Console Docs";
        window.addEventListener('click', updatePageNumber, false);
        lastPageNum = datatable.getLastPageNumber();
        pageNum.innerHTML = "page " + datatable.getCurrentPage() + " of " + lastPageNum;
      }
      else {
        console.log(json);
      }
    }, function(error) {
      // Need to catch this.
    }).catch(function(ex) {
      // need to catch this.
    });
  };

  updatePageNumber = function updatePageNumber() {
    pageNum.innerHTML = "page " + datatable.getCurrentPage() + " of " + lastPageNum;
  };

  // Builds the HTML Table out of myList json data from Ivy restful service.
  buildHtmlTable = function buildHtmlTable(arr) {
    var _helpOrder = ["Name", "Type", "Category", "Description", "Syntax", "Example", "See also"];
    var cellValue, tr, td;
    var table = _table_.cloneNode(false),
        tbody = _tbody_.cloneNode(false),
        columns = addAllColumnHeaders(_helpOrder, table);
    for (var i = 0, maxi = arr.length; i < maxi; ++i) {
      tr = _tr_.cloneNode(false);
      for (var j = 0, maxj = columns.length; j < maxj ; ++j) {
        td = _td_.cloneNode(false);
        cellValue = arr[i][columns[j]];
        if (Array.isArray(cellValue)) {
          cellValue = cellValue.join(', ');
        }
        td.appendChild(document.createTextNode(cellValue || ''));
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    table.id = "datatable";
    //table.classList.add("table", "is-bordered", "is-striped", "is-narrow");
    table.classList.add("table");
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