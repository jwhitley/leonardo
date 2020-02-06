/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import '@spectrum-css/vars/dist/spectrum-global.css';
import '@spectrum-css/vars/dist/spectrum-medium.css';
import '@spectrum-css/vars/dist/spectrum-light.css';

import '@spectrum-css/page/dist/index-vars.css';
import '@spectrum-css/typography/dist/index-vars.css';
import '@spectrum-css/icon/dist/index-vars.css';
import '@spectrum-css/link/dist/index-vars.css';
import '@spectrum-css/alert/dist/index-vars.css';
import '@spectrum-css/radio/dist/index-vars.css';
import '@spectrum-css/dialog/dist/index-vars.css';
import '@spectrum-css/button/dist/index-vars.css';
import '@spectrum-css/fieldgroup/dist/index-vars.css';
import '@spectrum-css/textfield/dist/index-vars.css';
import '@spectrum-css/dropdown/dist/index-vars.css';
import '@spectrum-css/fieldlabel/dist/index-vars.css';
import '@spectrum-css/checkbox/dist/index-vars.css';
import '@spectrum-css/buttongroup/dist/index-vars.css';
import '@spectrum-css/tooltip/dist/index-vars.css';
import '@spectrum-css/slider/dist/index-vars.css';
import '@spectrum-css/tabs/dist/index-vars.css';
import '@spectrum-css/illustratedmessage/dist/index-vars.css';

import './scss/colorinputs.scss';
import './scss/charts.scss';
import './scss/style.scss';

import '@adobe/focus-ring-polyfill';

import * as contrastColors from '@adobe/leonardo-contrast-colors';

import * as blinder from 'color-blind';

import * as d3 from 'd3';

// Import d3 plugins and add them to the d3 namespace
import * as d3cam02 from 'd3-cam02';
import * as d3hsluv from 'd3-hsluv';
import * as d3hsv from 'd3-hsv';
import * as d33d from 'd3-3d';
Object.assign(d3, d3cam02, d3hsluv, d3hsv, d33d);

import loadIcons from 'loadicons';
loadIcons('./spectrum-css-icons.svg');
loadIcons('./spectrum-icons.svg');

// import {randomId, throttle, deleteColor} from './index.js'
import ClipboardJS from 'clipboard';

new ClipboardJS('.copyButton');
new ClipboardJS('.themeOutputSwatch');

var themeConfigs = {};
var currentBackgroundColor;

let cvdModeDropdown = document.getElementById('cvdMode');

function randomId() {
   return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10);
}

function throttle(func, wait) {
  var timerId, lastRan;

  return function throttled() {
    var context = this;
    var args = arguments;

    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(timerId);
      timerId = setTimeout(function () {
        if ((Date.now() - lastRan) >= wait) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, (wait - (Date.now() - lastRan)) || 0);
    }
  };
}

function deleteColor(e) {
  var id = e.target.parentNode.id;
  var self = document.getElementById(id);

  self.remove();
  themeInput();
}

function paramSetup() {
  let url = new URL(window.location);
  let params = new URLSearchParams(url.search.slice(1));
  let pathName = url.pathname;

  if(params.has('name')) {
    let themeNameInput = document.getElementById('themeName');
    themeNameInput.value = params.get('name').toString();
  }
  if(params.has('config')) {
    let configParam = params.get('config');
    let config = JSON.parse(configParam);
    let colorScales = config.colorScales;
    let brightness = config.brightness;
    let contrast;
    if(!config.contrast) {
      contrast = 1;
    } else {
      contrast = config.contrast;
    }

    for(let i = 0; i < colorScales.length; i++) {
      let colorName = colorScales[i].name;
      let keyColors = colorScales[i].colorKeys;
      let colorSpace = colorScales[i].colorspace;
      let ratios = colorScales[i].ratios;
      // Create color scale item
      addColorScale(colorName, keyColors, colorSpace, ratios);
    }

    let slider = document.getElementById('themeBrightnessSlider');
    slider.value = brightness;

    let contrastSlider = document.getElementById('themeContrastSlider');
    contrastSlider.value = contrast;

    sliderInput();
    throttle(themeInput, 10);
  }
}
paramSetup();

/* ---------------------------  */
/*     CREATE THEME SCRIPTS     */
/* ---------------------------
1. Generate Color Scale object
2. For each color scale object, function for color inputs.
3. AddColor function (per object)
4. Delete object
5. Add object (run generate color)
6. Param setup
7. Param input (read if has params )
8. Function output
9. Colors output (for each object, output colors in panel)
10. Toggle configs visibility
11. Brightness slider value sync
12. Base color input options based on color objects available
13. Add color from Leonardo URL
14.
*/


let predefinedColorNames = [
  'Azure',
  'Forest',
  'Cerulean',
  'Blue',
  'Pink',
  'Red',
  'Indigo',
  'Purple',
  'Blue',
  'Green',
  'Crimson',
  'Salmon',
  'Orange',
  'Tangerine',
  'Yellow',
  'Brown',
  'Umber',
  'Ochre',
  'Periwinkle',
  'Sage',
  'Rose',
  'Lavender',
  'Lilac',
  'Mauve',
  'Mustard',
  'Seafoam',
  'Celery',
  'Teal',
  'Turquise',
  'Sky',
  'Gray',
  'Slate'
];

window.addColorScale = addColorScale;
function addColorScale(c, k, s, r) {
  // for checking to see if items already exist
  let items = document.getElementsByClassName('themeColor_item');
  // create unique ID for color object
  let thisId = randomId();
  // generate color input objects:
  // gradient, inputs, etc.
  let wrapper = document.getElementById('themeColorWrapper');
  // Remove empty state
  if(!document.getElementById('themeColorEmptyState')) {
    // Do nothing
  } else {
    wrapper.innerHTML = ' ';
  }

  // Create theme item
  let item = document.createElement('div');
  item.className = 'themeColor_item';
  item.id = thisId;

  // Create gradient
  let gradient = document.createElement('div');
  gradient.className = 'themeColor_gradient';
  let gradientId = thisId.concat('_gradient');
  gradient.id = gradientId;

  // Create form container
  let inputs = document.createElement('div');
  inputs.className = 'spectrum-Form spectrum-Form--row themeColor_configs';

  // Color Name Input
  let colorName = document.createElement('div');
  colorName.className = 'spectrum-Form-item';
  let colorNameLabel = document.createElement('label');
  colorNameLabel.className = 'spectrum-FieldLabel';
  colorNameLabel.for = thisId.concat('_colorName');
  let colorNameInput = document.createElement('input');
  colorNameInput.type = 'text';
  colorNameInput.className = 'spectrum-Textfield colorNameInput';
  colorNameInput.id = thisId.concat('_colorName');
  colorNameInput.name = thisId.concat('_colorName');

  // if first color item, just name it gray.
  if(c == undefined) {
    if(items.length == 0) {
      // if first color with undefined c argument:
      colorNameInput.value = 'Gray';
    }
    else {
      // if not first, c not defined, randomly assign color name:
      colorNameInput.value = predefinedColorNames[Math.floor(Math.random()*predefinedColorNames.length)];
    }
  }
  else {
    // if c defined argument, this should be color name.
    colorNameInput.value = c;
  }


  colorNameInput.onchange = throttle(themeInput, 10);
  colorNameLabel.innerHTML = 'Color name';
  colorName.appendChild(colorNameLabel);
  colorName.appendChild(colorNameInput);

  // Key Color Input
  let keyColors = document.createElement('div');
  keyColors.className = 'spectrum-Form-item';
  let keyColorsLabel = document.createElement('label');
  keyColorsLabel.className = 'spectrum-FieldLabel';
  keyColorsLabel.for = thisId.concat('_keyColors');
  let keyColorsInput = document.createElement('div');
  keyColorsInput.className = 'keyColorsWrapper';
  let keyColorsId = thisId.concat('_keyColors');
  keyColorsInput.id = keyColorsId;
  keyColorsLabel.innerHTML = 'Key colors';
  keyColors.appendChild(keyColorsLabel);
  keyColors.appendChild(keyColorsInput);

  // Key Colors Actions
  let addColors = document.createElement('div');
  addColors.className = 'spectrum-Form-item labelSpacer keyColorActions';
  let addButton = document.createElement('button');
  addButton.className = 'spectrum-ActionButton';
  let buttonId = thisId.concat('_addKeyColor');
  addButton.id = buttonId;
  addButton.onclick = themeAddColor;
  addButton.innerHTML = `
  <svg xmlns:xlink="http://www.w3.org/1999/xlink" class="spectrum-Icon spectrum-Icon--sizeS" focusable="false" aria-hidden="true" aria-label="Add">
    <use xlink:href="#spectrum-icon-18-Add" />
  </svg>
  `;
  let bulkButton = document.createElement('button');
  bulkButton.className = 'spectrum-ActionButton';
  let bulkId = thisId.concat('_addBulk');
  bulkButton.id = bulkId;
  bulkButton.onclick = addBulk;
  bulkButton.innerHTML = `
  <svg xmlns:xlink="http://www.w3.org/1999/xlink" class="spectrum-Icon spectrum-Icon--sizeS" focusable="false" aria-hidden="true" aria-label="Add">
    <use xlink:href="#spectrum-icon-18-BoxAdd" />
  </svg>
  `;

  addColors.appendChild(addButton);
  addColors.appendChild(bulkButton);

  // Interpolation mode
  let interp = document.createElement('div');
  interp.className = 'spectrum-Form-item';
  let interpLabel = document.createElement('label');
  interpLabel.className = 'spectrum-FieldLabel';
  interpLabel.for = thisId.concat('_mode');
  let interpLabelText = 'Colorspace interpolation';
  let interpDropdown = document.createElement('div');
  interpDropdown.className = 'spectrum-Dropdown';
  interpDropdown.id = thisId.concat('_modeDropdown');
  let interpSelect = document.createElement('select');
  interpSelect.className = 'spectrum-FieldButton spectrum-Dropdown-trigger';
  interpSelect.id = thisId.concat('_mode');
  interpSelect.name = thisId.concat('_mode');
  interpSelect.oninput = throttle(themeInput, 20);
  let interpDropdownIcon = document.createElement('span');
  interpDropdownIcon.className = 'spectrum-Dropdown-iconWrapper';
  interpDropdownIcon.innerHTML = `
  <svg xmlns:xlink="http://www.w3.org/1999/xlink" class="spectrum-Icon spectrum-UIIcon-ChevronDownMedium spectrum-Dropdown-icon">
    <use xlink:href="#spectrum-css-icon-ChevronDownMedium"></use>
  </svg>`;

  interpLabel.innerHTML = interpLabelText;
  interpDropdown.appendChild(interpSelect);
  interpDropdown.appendChild(interpDropdownIcon);
  interp.appendChild(interpLabel);
  interp.appendChild(interpDropdown);

  // Interpolation options
  interpSelect.options.length = 0;

  let opts = {
    'CAM02': 'CIECAM02',
    'LCH': 'Lch',
    'LAB': 'Lab',
    'HSL': 'HSL',
    'HSLuv': 'HSLuv',
    'HSV': 'HSV',
    'RGB': 'RGB'
  };

  for(let index in opts) { interpSelect.options[interpSelect.options.length] = new Option(opts[index], index); }
  if (s == undefined) {
    interpSelect.value = 'CAM02';
  }
  else {
    interpSelect.value = s;
  }


  // Ratios
  let ratios = document.createElement('div');
  ratios.className = 'spectrum-Form-item';
  let ratiosLabel = document.createElement('label');
  ratiosLabel.className = 'spectrum-FieldLabel';
  ratiosLabel.innerHTML = 'Contrast ratios';
  ratiosLabel.for = thisId.concat('_ratios');
  let ratiosInput = document.createElement('input');
  ratiosInput.type = 'text';
  if(r == undefined) {
    ratiosInput.value = '3, 4.5';
  }
  else {
    ratiosInput.value = r;
  }

  ratiosInput.className = 'spectrum-Textfield';
  ratiosInput.id = thisId.concat('_ratios');
  ratiosInput.name = thisId.concat('_ratios');
  ratiosInput.oninput = throttle(themeInput, 10);
  ratios.appendChild(ratiosLabel);
  ratios.appendChild(ratiosInput);

  // Actions
  let actions = document.createElement('div');
  actions.className = 'spectrum-ButtonGroup spectrum-Form-item labelSpacer';
  let edit = document.createElement('button');
  edit.className = 'spectrum-ActionButton';
  edit.innerHTML = `
  <!-- <span class="spectrum-ActionButton-label">Add from URL</span> -->
  <svg xmlns:xlink="http://www.w3.org/1999/xlink" class="spectrum-Icon spectrum-Icon--sizeS" focusable="false" aria-hidden="true" aria-label="Add">
    <use xlink:href="#spectrum-icon-18-Edit" />
  </svg>`
  // edit.addEventListener('click', openEditColorScale) // TODO => create openEditColorScale function to open colors tab w/ settings of this object.
  let deleteColor = document.createElement('button');
  deleteColor.className = 'spectrum-ActionButton';
  deleteColor.id = thisId.concat('_delete');
  deleteColor.innerHTML = `
  <!-- <span class="spectrum-ActionButton-label">Add Color</span> -->
  <svg xmlns:xlink="http://www.w3.org/1999/xlink" class="spectrum-Icon spectrum-Icon--sizeS" focusable="false" aria-hidden="true" aria-label="Add">
    <use xlink:href="#spectrum-icon-18-Delete" />
  </svg>`;
  deleteColor.onclick = themeDeleteItem;
  actions.appendChild(edit);
  actions.appendChild(deleteColor);

  // Put it all together
  inputs.appendChild(colorName);
  inputs.appendChild(keyColors);
  inputs.appendChild(addColors)
  inputs.appendChild(interp);
  inputs.appendChild(ratios);
  inputs.appendChild(actions);

  item.appendChild(gradient);
  item.appendChild(inputs);

  wrapper.appendChild(item);

  // Then run functions on the basic placeholder inputs
  // document.getElementById(buttonId).click();
  if (k == undefined) {
    document.getElementById(buttonId).click();
  }
  else {
    for (let i = 0; i < k.length; i++) {
      themeAddColor(k[i], buttonId);
    }
  }
  // generate the number of values equal to the width of the item
  let n = window.innerWidth - 272;
  let rampData = contrastColors.createScale({swatches: n, colorKeys: ['#000000'], colorspace: 'LAB'});

  let colors = rampData.colors;

  themeRamp(colors, n, gradientId);
  toggleControls();
  baseScaleOptions();

  let toggle = document.getElementById('toggleConfigButton');
  if(toggle.classList.contains('is-selected')) {
    inputs.classList.add('is-hidden');
    gradient.classList.add('is-large');
  }

  document.getElementById(thisId.concat('_colorName')).addEventListener('input', baseScaleOptions);
  document.getElementById(thisId.concat('_delete')).addEventListener('click', themeDeleteItem);

  themeInput();
}

// Update theme when theme name is changed
document.getElementById('themeName').addEventListener('input', themeInput);
// Update theme when base color selection is changed
document.getElementById('themeBase').addEventListener('input', themeInput);


function themeRamp(colors, n = window.innerWidth - 272, dest) {
  let container = document.getElementById(dest);
  container = d3.select(container);

  let canvas = container.append("canvas")
    .attr("width", n)
    .attr("height", 1);
  let context = canvas.node().getContext("2d");

  canvas.style.height = "32px";
  canvas.style.width = n;
  canvas.style.imageRendering = "pixelated";
  canvas.className = 'themeColor_canvas';
  for (let i = 1; i < n; ++i) {
    context.fillStyle = colors[i];
    context.fillRect(i, 0, 1, 32);
  }
  return canvas;
}


// Recreation of addColor function, specifying items needed for theme UI
function themeAddColor(c, thisId = this.id) {
  // let thisId = this.id;
  let parent = thisId.replace('_addKeyColor', '');
  let destId = parent.concat('_keyColors');
  let dest = document.getElementById(destId);
  let div = document.createElement('div');

  let randId = randomId();
  div.className = 'keyColor';
  div.id = randId + '-item';
  let sw = document.createElement('input');
  sw.type = "color";
  sw.value = c;
  sw.oninput = throttle(themeInput, 50);

  sw.className = 'keyColor-Item';
  sw.id = randId + '-sw';
  sw.style.backgroundColor = c;

  let button = document.createElement('button');
  button.className = 'spectrum-ActionButton';
  button.innerHTML = `
  <svg class="spectrum-Icon spectrum-Icon--sizeS" focusable="false" aria-hidden="true" aria-label="Delete">
    <use xlink:href="#spectrum-icon-18-Delete" />
  </svg>`;

  button.onclick = deleteColor;
  div.appendChild(sw);
  div.appendChild(button);
  dest.appendChild(div);
}

function themeDeleteItem(e) {
  var id = e.target.parentNode.parentNode.parentNode.id;
  var self = document.getElementById(id);

  self.remove();

  toggleControls();
  throttle(themeInput, 20);
}

// Create options for colors to use as base scale
function baseScaleOptions() {
  let baseSelect = document.getElementById('themeBase');
  baseSelect.options.length = 0;

  let colorNames = document.getElementsByClassName('colorNameInput');
  let opts = {};
  for (let i = 0; i < colorNames.length; i++) {
    let colorname = colorNames[i].value;
    opts[colorname] = colorname;
  }

  for(let index in opts) { baseSelect.options[baseSelect.options.length] = new Option(opts[index], index); }
}

function toggleControls() {
  let items = document.getElementsByClassName('themeColor_item');
  let sliderWrap = document.getElementById('brightnessSliderWrapper');
  let slider = document.getElementById('themeBrightnessSlider');
  let themeBaseLabel = document.getElementById('themeBaseLabel');
  let modeDropdown = document.getElementById('modeDropdown');
  let baseSelect = document.getElementById('themeBase');

  if(items.length > 0) {
    // if there are items, enable fields
    sliderWrap.classList.remove('is-disabled');
    themeBaseLabel.classList.remove('is-disabled');
    modeDropdown.classList.remove('is-disabled');
    slider.disabled = false;
    baseSelect.disabled = false;
  }
  else if(items.length == 0) {
    // disable fields
    sliderWrap.classList.add('is-disabled');
    themeBaseLabel.classList.add('is-disabled');
    modeDropdown.classList.add('is-disabled');
    slider.disabled = true;
    baseSelect.disabled = true;
    baseSelect.value = ' ';
  }
}

function cvdColors(colors) {
  let cvdMode = cvdModeDropdown.value;

  // if not an array
  if (!Array.isArray(colors)) {
    if (cvdMode == 'Deuteranomaly') {
      colors = blinder.deuteranomaly(colors);
    }
    else if (cvdMode == 'Deuteranopia') {
      colors = blinder.deuteranopia(colors);
    }
    else if (cvdMode == 'Protanomaly') {
      colors = blinder.protanomaly(colors);
    }
    else if (cvdMode == 'Protanopia') {
      colors = blinder.protanopia(colors);
    }
    else if (cvdMode == 'Tritanomaly') {
      colors = blinder.tritanomaly(colors);
    }
    else if (cvdMode == 'Tritanopia') {
      colors = blinder.tritanopia(colors);
    }
    else if (cvdMode == 'Achromatomaly') {
      colors = blinder.achromatomaly(colors);
    }
    else if (cvdMode == 'Achromatopsia') {
      colors = blinder.achromatopsia(colors);
    }
    else {
      // do nothing
    }
    colors = d3.rgb(colors).formatRgb();
  }
  // must be an array.
  else {
    if (cvdMode == 'Deuteranomaly') {
      colors = colors.map(c => blinder.deuteranomaly(c));
    }
    else if (cvdMode == 'Deuteranopia') {
      colors = colors.map(c => blinder.deuteranopia(c));
    }
    else if (cvdMode == 'Protanomaly') {
      colors = colors.map(c => blinder.protanomaly(c));
    }
    else if (cvdMode == 'Protanopia') {
      colors = colors.map(c => blinder.protanopia(c));
    }
    else if (cvdMode == 'Tritanomaly') {
      colors = colors.map(c => blinder.tritanomaly(c));
    }
    else if (cvdMode == 'Tritanopia') {
      colors = colors.map(c => blinder.tritanopia(c));
    }
    else if (cvdMode == 'Achromatomaly') {
      colors = colors.map(c => blinder.achromatomaly(c));
    }
    else if (cvdMode == 'Achromatopsia') {
      colors = colors.map(c => blinder.achromatopsia(c));
    }
    else {
      // do nothing
    }
    colors = colors.map(c => d3.rgb(c).formatRgb());
  }

  return colors;
}

window.themeInput = themeInput;
function themeInput() {
  // Run this function any time an object is added or any item is changed.
  // Gather all color scale objects
  let items = document.getElementsByClassName('themeColor_item');
  let themeName = document.getElementById('themeName');

  let colorScales = [];

  // Create color scale objects
  for (let i = 0; i < items.length; i++) {
    let id = items[i].id;
    let thisElement = document.getElementById(id);
    // 1. find color name
    let colorNameInput = id.concat('_colorName');
    let colorName = document.getElementById(colorNameInput).value;
    // 2. find all key colors
    let colorKeys = thisElement.getElementsByClassName('keyColor-Item');
    let inputColors = [];
    let tempArgs = [];
    for(let i=0; i<colorKeys.length; i++) {
      inputColors.push(colorKeys[i].value);
    }
    // Convert input value into a split array of hex values.
    // remove any whitespace from inputColors
    tempArgs.push(inputColors);
    let colorArgs = tempArgs.join("").split(',').filter(String);

    // 3. find mode
    let modeId = id.concat('_mode');
    let modeSelect = document.getElementById(modeId);
    let mode = modeSelect.value;

    // 4. find ratios
    let ratiosId = id.concat('_ratios');
    let ratiosInput = document.getElementById(ratiosId);
    let rVals = ratiosInput.value;
    let r = new Array(rVals);
    let rSplit = r.join("").split(',');
    let ratios = rSplit.map(x => parseFloat(x));
    // TODO: remove all values of NaN

    let colorObj = {
      name: colorName,
      colorKeys: colorArgs,
      colorspace: mode,
      ratios: ratios
    };

    let gradientId = id.concat('_gradient');
    let gradient = document.getElementById(gradientId);
    gradient.innerHTML = ' ';
    let n = window.innerWidth - 272;
    let rampData = contrastColors.createScale({swatches: n, colorKeys: colorArgs, colorspace: mode});
    let colors = rampData.colors;
    // Conditional for CVDs

    colors = cvdColors(colors);

    themeRamp(colors, n, gradientId);
    // - assign properties to an object

    colorScales.push(colorObj);
  }

  // Find name of selected base scale color
  let baseSelect = document.getElementById('themeBase');
  let baseSelectValue = baseSelect.value;

  // Then, pass all props to 'generateAdaptiveTheme'
  themeConfigs.baseScale = baseSelectValue;
  themeConfigs.colorScales = colorScales;
  let themeBrightnessSlider = document.getElementById('themeBrightnessSlider');
  let themeBrightness = themeBrightnessSlider.value;
  themeConfigs.brightness = themeBrightness;
  let themeContrastSlider = document.getElementById('themeContrastSlider');
  let themeContrast = themeContrastSlider.value;
  themeConfigs.contrast = themeContrast;

  let theme = contrastColors.generateAdaptiveTheme(themeConfigs);

  let themeColorArray = [];

  let varPrefix = '--';
  let themeOutputs = document.getElementById('themeOutputs');
  themeOutputs.innerHTML = ' ';

  // Iterate each color from theme except 1st object (background)
  for (let i=0; i<theme.length; i++) {
    let wrapper = document.createElement('div');

    let swatchWrapper = document.createElement('div');
    swatchWrapper.className = 'themeOutputColor';

    // Iterate each color value
    if (theme[i].values) {
      let p = document.createElement('p');
      p.className = 'spectrum-Subheading';
      p.innerHTML = theme[i].name;

      wrapper.appendChild(p);

      for(let j=0; j<theme[i].values.length; j++) { // for each value object
        let key = theme[i].values[j].name; // output "name" of color
        let prop = varPrefix.concat(key);
        let originalValue = theme[i].values[j].value; // output value of color
        // transform original color based on preview mode
        let value = cvdColors(originalValue);

        // create CSS property
        document.documentElement.style
          .setProperty(prop, value);
        // create swatch
        let div = document.createElement('div');
        div.className = 'themeOutputSwatch';
        // copy text should be for value of original color, not of preview color.
        div.setAttribute('data-clipboard-text', originalValue);
        div.setAttribute('tabindex', '0');
        div.style.backgroundColor = value;

        swatchWrapper.appendChild(div);
        themeColorArray.push(originalValue);
      }
      wrapper.appendChild(swatchWrapper);
    }
    else if (theme[i].background) {
      let p = document.createElement('p');
      p.className = 'spectrum-Subheading';
      p.innerHTML = 'Background';

      wrapper.appendChild(p);

      // grab background color data
      let key = 'theme-background'; // "name" of color
      let prop = varPrefix.concat(key);
      let originalValue = theme[i].background; // output value of color
      // set global variable value. Probably shouldn't do it this way.
      currentBackgroundColor = originalValue;
      let value = cvdColors(originalValue);

      // create CSS property
      document.documentElement.style
        .setProperty(prop, value);
      // create swatch
      let div = document.createElement('div');
      div.className = 'themeOutputSwatch';
      div.setAttribute('tabindex', '0');
      div.setAttribute('data-clipboard-text', originalValue);
      div.style.backgroundColor = value;

      swatchWrapper.appendChild(div);
      wrapper.appendChild(swatchWrapper);

      themeColorArray.push(originalValue);
    }

    themeOutputs.appendChild(wrapper);
  }

  let copyThemeColors = document.getElementById('copyThemeColors');
  copyThemeColors.setAttribute('data-clipboard-text', themeColorArray);

  // write config file to output panel
  let paramsOutput = document.getElementById('themeParams');

  paramsOutput.innerHTML = JSON.stringify(themeConfigs, null, 2);
  let themeObj = JSON.stringify(themeConfigs);

  updateParams(themeName.value, themeObj);
}

window.sliderInput = sliderInput;
function sliderInput() {
  let sliderBValLabel = document.getElementById('themeBrightnessValue');
  let sliderCValLabel = document.getElementById('themeContrastValue');

  let sliderB = document.getElementById('themeBrightnessSlider');
  let sliderBVal = sliderB.value;
  let sliderC = document.getElementById('themeContrastSlider');
  let sliderCVal = sliderC.value;

  sliderBValLabel.innerHTML = sliderBVal;
  sliderCValLabel.innerHTML = sliderCVal;

  let items = document.getElementsByClassName('themeColor_item');
  // If theme items are present, run themeInput
  if (items !== undefined) {
    themeInput();
  }
}

window.addBulk = addBulk;
function addBulk(e) {
  let id = e.target.parentNode.parentNode.parentNode.id;
  let button = document.getElementById('bulkAddButton');
  button.onclick = bulkItemColorInput;

  let dialog = document.getElementsByClassName('addBulkColorDialog');
  for(let i = 0; i < dialog.length; i++) {
    dialog[i].classList.add("is-open");
    dialog[i].id = id.concat('_dialog');
  }
  document.getElementById('dialogOverlay').style.display = 'block';
}

window.cancelBulk = cancelBulk;
function cancelBulk() {
  let dialog = document.getElementsByClassName('addBulkColorDialog');
  for(let i = 0; i < dialog.length; i++) {
    dialog[i].classList.remove("is-open");
    dialog[i].id = ' ';
  }
  document.getElementById('dialogOverlay').style.display = 'none';
}

window.bulkItemColorInput = function bulkItemColorInput(e) {
  let id = e.target.parentNode.parentNode.id;
  let itemId = id.replace('_dialog', '');
  let keyInputId = itemId.concat('_keyColors');
  let buttonId = itemId.concat('_addKeyColor');
  let keyInputs = document.getElementById(keyInputId);

  let bulkInputs = document.getElementById('bulkColors');
  let bulkValues = bulkInputs.value.replace(/\r\n/g,"\n").replace(/[,\/]/g,"\n").replace(" ", "").replace(/['\/]/g, "").replace(/["\/]/g, "").split("\n");
  // let isSwatch = document.getElementById('importAsSwatch').checked;
  let bgInput = currentBackgroundColor;

  // add key colors for each input
  for(let i=0; i<bulkValues.length; i++) {
    themeAddColor(d3.color(bulkValues[i]).formatHex(), itemId);
  }
  // if (isSwatch) {
  //   // create ratio inputs for each contrast
  //   for (let i=0; i<bulkValues.length; i++) {
  //     let cr = contrastColors.contrast([d3.rgb(bulkValues[i]).r, d3.rgb(bulkValues[i]).g, d3.rgb(bulkValues[i]).b], [d3.rgb(bgInput).r, d3.rgb(bgInput).g, d3.rgb(bgInput).b]);
  //     addRatio(cr.toFixed(2));
  //   }
  //   bg.value = bgInput;
  // }

  // Hide dialog
  cancelBulk();
  // Run colorinput
  themeInput();

  // clear inputs on close
  bulkInputs.value = " ";
}

window.toggleConfigs = toggleConfigs;
function toggleConfigs(e) {
  let configs = document.getElementsByClassName('themeColor_configs');
  let button = document.getElementById('toggleConfigButton');
  let gradient = document.getElementsByClassName('themeColor_gradient');
  button.classList.toggle('is-selected');

  for (let i = 0; i < configs.length; i ++) {
    configs[i].classList.toggle('is-hidden');
    gradient[i].classList.toggle('is-large');
  }
}

// Passing variable parameters to URL
function updateParams(n, t) {
  let url = new URL(window.location);
  let params = new URLSearchParams(url.search.slice(1));
  let tabColor = document.getElementById("tabColor");

  params.set('name', n);         // Theme name
  params.set('config', t);       // Configurations

  window.history.replaceState({}, '', '?' + params); // update the page's URL.
}
