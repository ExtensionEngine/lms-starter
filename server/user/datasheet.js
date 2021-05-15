'use strict';

const { camelCase } = require('change-case');
const intoStream = require('into-stream');
const { Workbook } = require('exceljs');
const Worksheet = require('exceljs/dist/es5/doc/worksheet');

const isCsv = file => file.mimetype === 'text/csv';
const isString = arg => typeof arg === 'string';
const parseCell = cell => cell.isHyperlink ? parseCellText(cell.value.text) : cell.value;
const parseCellText = cellText => cellText.richText
  ? cellText.richText.reduce((acc, it) => `${acc}${it.text}`, '')
  : cellText;

Object.assign(Workbook.prototype, {
  addSheet(sheet) {
    const id = this.nextId;
    const lastOrderNo = getLastOrderNo(this._worksheets);
    Object.assign(sheet, {
      id,
      name: sheet.name || `Sheet${id}`,
      orderNo: lastOrderNo + 1,
      _workbook: this
    });
    this._worksheets[id] = sheet;
    return this;
  },
  send(res, { format }) {
    res.type(format);
    const writer = this[format] || this.xlsx;
    return writer.write(res);
  }
});

class Datasheet extends Worksheet {
  constructor({ name, columns, data, ...options } = {}) {
    super(options);
    this.name = name;
    if (columns) this._setupHeader(columns);
    if (data) data.forEach(record => this.addRow(record));
  }

  _setupHeader(columns) {
    this.columns = Object.keys(columns).map(key => {
      let config = columns[key];
      config = isString(config) ? { header: config } : config;
      return { ...config, key };
    });
  }

  getHeaders({ include, exclude } = {}) {
    let filter;
    if (Array.isArray(include) && include.length) {
      filter = key => include.includes(key);
    } else if (Array.isArray(exclude) && exclude.length) {
      filter = key => !(exclude.includes(key));
    } else {
      filter = key => true;
    }
    const headers = [];
    this.getRow(1).eachCell((cell, i) => {
      const header = cell.value;
      const key = camelCase(header);
      if (filter(key)) headers.push({ key, header, index: cell.col });
    });
    return headers;
  }

  mapRows(mapper) {
    const records = [];
    this.eachRow((row, i) => {
      if (i === 1) return;
      records.push(mapper(row, i));
    });
    return records;
  }

  toJSON(options) {
    const headers = this.getHeaders(options);
    return this.mapRows(row => headers.reduce((acc, { key, index }) => {
      return Object.assign(acc, { [key]: parseCell(row.getCell(index)) });
    }, {}));
  }

  static fromWorksheet(sheet) {
    return Object.assign(new this(), sheet);
  }

  static async load(file) {
    const wb = new Workbook();
    if (isCsv(file)) {
      const ws = await wb.csv.read(intoStream(file.buffer));
      return this.fromWorksheet(ws);
    }
    await wb.xlsx.load(file.buffer);
    const ws = wb.getWorksheet(1);
    return this.fromWorksheet(ws);
  }

  toWorkbook(options = {}) {
    return Object.assign(new Workbook(), options).addSheet(this);
  }
}

module.exports = Datasheet;

function getLastOrderNo(sheets) {
  return Math.max(...sheets.map(it => it ? it.orderNo : 0));
}
