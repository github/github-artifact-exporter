"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
class Search extends base_1.default {
    async run() {
        this._help();
    }
}
exports.default = Search;
Search.description = "GitHub Search base command";
Search.flags = Object.assign({}, base_1.default.flags);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL3NlYXJjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGtDQUFrQztBQUVsQyxNQUE4QixNQUFPLFNBQVEsY0FBVztJQU90RCxLQUFLLENBQUMsR0FBRztRQUNQLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNmLENBQUM7O0FBVEgseUJBVUM7QUFUUSxrQkFBVyxHQUFHLDRCQUE0QixDQUFDO0FBRTNDLFlBQUsscUJBQ1AsY0FBVyxDQUFDLEtBQUssRUFDcEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmFzZUNvbW1hbmQgZnJvbSBcIi4uL2Jhc2VcIjtcblxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgU2VhcmNoIGV4dGVuZHMgQmFzZUNvbW1hbmQge1xuICBzdGF0aWMgZGVzY3JpcHRpb24gPSBcIkdpdEh1YiBTZWFyY2ggYmFzZSBjb21tYW5kXCI7XG5cbiAgc3RhdGljIGZsYWdzID0ge1xuICAgIC4uLkJhc2VDb21tYW5kLmZsYWdzLFxuICB9O1xuXG4gIGFzeW5jIHJ1bigpIHtcbiAgICB0aGlzLl9oZWxwKCk7XG4gIH1cbn1cbiJdfQ==