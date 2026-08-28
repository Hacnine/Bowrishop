"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/@standard-schema+utils@0.3.0";
exports.ids = ["vendor-chunks/@standard-schema+utils@0.3.0"];
exports.modules = {

/***/ "(ssr)/../node_modules/.pnpm/@standard-schema+utils@0.3.0/node_modules/@standard-schema/utils/dist/index.js":
/*!************************************************************************************************************!*\
  !*** ../node_modules/.pnpm/@standard-schema+utils@0.3.0/node_modules/@standard-schema/utils/dist/index.js ***!
  \************************************************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   SchemaError: () => (/* binding */ SchemaError),\n/* harmony export */   getDotPath: () => (/* binding */ getDotPath)\n/* harmony export */ });\n// src/getDotPath/getDotPath.ts\nfunction getDotPath(issue) {\n  if (issue.path?.length) {\n    let dotPath = \"\";\n    for (const item of issue.path) {\n      const key = typeof item === \"object\" ? item.key : item;\n      if (typeof key === \"string\" || typeof key === \"number\") {\n        if (dotPath) {\n          dotPath += `.${key}`;\n        } else {\n          dotPath += key;\n        }\n      } else {\n        return null;\n      }\n    }\n    return dotPath;\n  }\n  return null;\n}\n\n// src/SchemaError/SchemaError.ts\nvar SchemaError = class extends Error {\n  /**\n   * The schema issues.\n   */\n  issues;\n  /**\n   * Creates a schema error with useful information.\n   *\n   * @param issues The schema issues.\n   */\n  constructor(issues) {\n    super(issues[0].message);\n    this.name = \"SchemaError\";\n    this.issues = issues;\n  }\n};\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0BzdGFuZGFyZC1zY2hlbWErdXRpbHNAMC4zLjAvbm9kZV9tb2R1bGVzL0BzdGFuZGFyZC1zY2hlbWEvdXRpbHMvZGlzdC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiOzs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUIsSUFBSTtBQUM3QixVQUFVO0FBQ1Y7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBSUUiLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcaGFjbmlcXFByb2plY3RzXFxUcmVuZHlkb3JhXFxub2RlX21vZHVsZXNcXC5wbnBtXFxAc3RhbmRhcmQtc2NoZW1hK3V0aWxzQDAuMy4wXFxub2RlX21vZHVsZXNcXEBzdGFuZGFyZC1zY2hlbWFcXHV0aWxzXFxkaXN0XFxpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBzcmMvZ2V0RG90UGF0aC9nZXREb3RQYXRoLnRzXG5mdW5jdGlvbiBnZXREb3RQYXRoKGlzc3VlKSB7XG4gIGlmIChpc3N1ZS5wYXRoPy5sZW5ndGgpIHtcbiAgICBsZXQgZG90UGF0aCA9IFwiXCI7XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIGlzc3VlLnBhdGgpIHtcbiAgICAgIGNvbnN0IGtleSA9IHR5cGVvZiBpdGVtID09PSBcIm9iamVjdFwiID8gaXRlbS5rZXkgOiBpdGVtO1xuICAgICAgaWYgKHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIGtleSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICBpZiAoZG90UGF0aCkge1xuICAgICAgICAgIGRvdFBhdGggKz0gYC4ke2tleX1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRvdFBhdGggKz0ga2V5O1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRvdFBhdGg7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8vIHNyYy9TY2hlbWFFcnJvci9TY2hlbWFFcnJvci50c1xudmFyIFNjaGVtYUVycm9yID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKlxuICAgKiBUaGUgc2NoZW1hIGlzc3Vlcy5cbiAgICovXG4gIGlzc3VlcztcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzY2hlbWEgZXJyb3Igd2l0aCB1c2VmdWwgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBpc3N1ZXMgVGhlIHNjaGVtYSBpc3N1ZXMuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihpc3N1ZXMpIHtcbiAgICBzdXBlcihpc3N1ZXNbMF0ubWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gXCJTY2hlbWFFcnJvclwiO1xuICAgIHRoaXMuaXNzdWVzID0gaXNzdWVzO1xuICB9XG59O1xuZXhwb3J0IHtcbiAgU2NoZW1hRXJyb3IsXG4gIGdldERvdFBhdGhcbn07XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/../node_modules/.pnpm/@standard-schema+utils@0.3.0/node_modules/@standard-schema/utils/dist/index.js\n");

/***/ })

};
;