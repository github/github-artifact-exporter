"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VAAgent = require("@department-of-veterans-affairs/agent");
const command_1 = require("@oclif/command");
const rest_1 = require("@octokit/rest");
const luxon_1 = require("luxon");
class Base extends command_1.default {
    constructor(argv, config) {
        super(argv, config);
        // this is immediately overwritten in the init method
        this.github = new rest_1.Octokit();
    }
    /**
     * Parse date into ISO or "*" if null/undefined this
     * allows it to be used with the `created` filter
     * for GitHub Search
     *
     * @param {string} flagName
     * @param {string} date
     * @returns {string}
     */
    parseDateFlag(flagName, date) {
        let searchDate = "*";
        if (date) {
            const datetime = luxon_1.DateTime.fromFormat(date, "yyyy-MM-dd");
            if (!datetime.isValid) {
                throw new Error(`unable to parse flag "${flagName}"\n${datetime.invalidExplanation}`);
            }
            searchDate = datetime.toISODate();
        }
        return searchDate;
    }
    async init() {
        const { flags: { baseUrl, token }, } = this.parse(this.constructor);
        this.github = new rest_1.Octokit({
            baseUrl,
            auth: token,
            request: { agent: new VAAgent() },
        });
    }
}
exports.default = Base;
Base.flags = {
    baseUrl: command_1.flags.string({
        description: "GitHub base url",
        default: "https://api.github.com",
    }),
    token: command_1.flags.string({
        description: "GitHub personal access token",
        env: "GITHUB_TOKEN",
        required: true,
    }),
    owner: command_1.flags.string({
        dependsOn: ["repo"],
        description: "GitHub repository owner",
    }),
    repo: command_1.flags.string({
        dependsOn: ["owner"],
        description: "GitHub repository name",
    }),
    format: command_1.flags.enum({
        options: ["JSON", "CSV"],
        default: "JSON",
        description: "export format",
    }),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUVBQWlFO0FBQ2pFLDRDQUE2RDtBQUU3RCx3Q0FBd0M7QUFDeEMsaUNBQWlDO0FBRWpDLE1BQThCLElBQUssU0FBUSxpQkFBTztJQUNoRCxZQUFZLElBQWMsRUFBRSxNQUFlO1FBQ3pDLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFdEIscURBQXFEO1FBQ3JELFdBQU0sR0FBWSxJQUFJLGNBQU8sRUFBRSxDQUFDO0lBRmhDLENBQUM7SUFpQ0Q7Ozs7Ozs7O09BUUc7SUFDSCxhQUFhLENBQUMsUUFBZ0IsRUFBRSxJQUF3QjtRQUN0RCxJQUFJLFVBQVUsR0FBRyxHQUFHLENBQUM7UUFFckIsSUFBSSxJQUFJLEVBQUU7WUFDUixNQUFNLFFBQVEsR0FBRyxnQkFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFFekQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUU7Z0JBQ3JCLE1BQU0sSUFBSSxLQUFLLENBQ2IseUJBQXlCLFFBQVEsTUFBTSxRQUFRLENBQUMsa0JBQWtCLEVBQUUsQ0FDckUsQ0FBQzthQUNIO1lBRUQsVUFBVSxHQUFHLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztTQUNuQztRQUVELE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxLQUFLLENBQUMsSUFBSTtRQUNSLE1BQU0sRUFDSixLQUFLLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEdBVzFCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFakMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLGNBQU8sQ0FBQztZQUN4QixPQUFPO1lBQ1AsSUFBSSxFQUFFLEtBQUs7WUFDWCxPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxPQUFPLEVBQUUsRUFBRTtTQUNsQyxDQUFDLENBQUM7SUFDTCxDQUFDOztBQW5GSCx1QkFvRkM7QUE3RVEsVUFBSyxHQUFHO0lBQ2IsT0FBTyxFQUFFLGVBQVMsQ0FBQyxNQUFNLENBQUM7UUFDeEIsV0FBVyxFQUFFLGlCQUFpQjtRQUM5QixPQUFPLEVBQUUsd0JBQXdCO0tBQ2xDLENBQUM7SUFFRixLQUFLLEVBQUUsZUFBUyxDQUFDLE1BQU0sQ0FBQztRQUN0QixXQUFXLEVBQUUsOEJBQThCO1FBQzNDLEdBQUcsRUFBRSxjQUFjO1FBQ25CLFFBQVEsRUFBRSxJQUFJO0tBQ2YsQ0FBQztJQUVGLEtBQUssRUFBRSxlQUFTLENBQUMsTUFBTSxDQUFDO1FBQ3RCLFNBQVMsRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUNuQixXQUFXLEVBQUUseUJBQXlCO0tBQ3ZDLENBQUM7SUFFRixJQUFJLEVBQUUsZUFBUyxDQUFDLE1BQU0sQ0FBQztRQUNyQixTQUFTLEVBQUUsQ0FBQyxPQUFPLENBQUM7UUFDcEIsV0FBVyxFQUFFLHdCQUF3QjtLQUN0QyxDQUFDO0lBRUYsTUFBTSxFQUFFLGVBQVMsQ0FBQyxJQUFJLENBQUM7UUFDckIsT0FBTyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQztRQUN4QixPQUFPLEVBQUUsTUFBTTtRQUNmLFdBQVcsRUFBRSxlQUFlO0tBQzdCLENBQUM7Q0FDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgVkFBZ2VudCBmcm9tIFwiQGRlcGFydG1lbnQtb2YtdmV0ZXJhbnMtYWZmYWlycy9hZ2VudFwiO1xuaW1wb3J0IENvbW1hbmQsIHsgZmxhZ3MgYXMgZmxhZ1R5cGVzIH0gZnJvbSBcIkBvY2xpZi9jb21tYW5kXCI7XG5pbXBvcnQgeyBJQ29uZmlnIH0gZnJvbSBcIkBvY2xpZi9jb25maWdcIjtcbmltcG9ydCB7IE9jdG9raXQgfSBmcm9tIFwiQG9jdG9raXQvcmVzdFwiO1xuaW1wb3J0IHsgRGF0ZVRpbWUgfSBmcm9tIFwibHV4b25cIjtcblxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgQmFzZSBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihhcmd2OiBzdHJpbmdbXSwgY29uZmlnOiBJQ29uZmlnKSB7XG4gICAgc3VwZXIoYXJndiwgY29uZmlnKTtcbiAgfVxuICAvLyB0aGlzIGlzIGltbWVkaWF0ZWx5IG92ZXJ3cml0dGVuIGluIHRoZSBpbml0IG1ldGhvZFxuICBnaXRodWI6IE9jdG9raXQgPSBuZXcgT2N0b2tpdCgpO1xuXG4gIHN0YXRpYyBmbGFncyA9IHtcbiAgICBiYXNlVXJsOiBmbGFnVHlwZXMuc3RyaW5nKHtcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkdpdEh1YiBiYXNlIHVybFwiLFxuICAgICAgZGVmYXVsdDogXCJodHRwczovL2FwaS5naXRodWIuY29tXCIsXG4gICAgfSksXG5cbiAgICB0b2tlbjogZmxhZ1R5cGVzLnN0cmluZyh7XG4gICAgICBkZXNjcmlwdGlvbjogXCJHaXRIdWIgcGVyc29uYWwgYWNjZXNzIHRva2VuXCIsXG4gICAgICBlbnY6IFwiR0lUSFVCX1RPS0VOXCIsXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICB9KSxcblxuICAgIG93bmVyOiBmbGFnVHlwZXMuc3RyaW5nKHtcbiAgICAgIGRlcGVuZHNPbjogW1wicmVwb1wiXSxcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkdpdEh1YiByZXBvc2l0b3J5IG93bmVyXCIsXG4gICAgfSksXG5cbiAgICByZXBvOiBmbGFnVHlwZXMuc3RyaW5nKHtcbiAgICAgIGRlcGVuZHNPbjogW1wib3duZXJcIl0sXG4gICAgICBkZXNjcmlwdGlvbjogXCJHaXRIdWIgcmVwb3NpdG9yeSBuYW1lXCIsXG4gICAgfSksXG5cbiAgICBmb3JtYXQ6IGZsYWdUeXBlcy5lbnVtKHtcbiAgICAgIG9wdGlvbnM6IFtcIkpTT05cIiwgXCJDU1ZcIl0sXG4gICAgICBkZWZhdWx0OiBcIkpTT05cIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcImV4cG9ydCBmb3JtYXRcIixcbiAgICB9KSxcbiAgfTtcblxuICAvKipcbiAgICogUGFyc2UgZGF0ZSBpbnRvIElTTyBvciBcIipcIiBpZiBudWxsL3VuZGVmaW5lZCB0aGlzXG4gICAqIGFsbG93cyBpdCB0byBiZSB1c2VkIHdpdGggdGhlIGBjcmVhdGVkYCBmaWx0ZXJcbiAgICogZm9yIEdpdEh1YiBTZWFyY2hcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZsYWdOYW1lXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkYXRlXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAqL1xuICBwYXJzZURhdGVGbGFnKGZsYWdOYW1lOiBzdHJpbmcsIGRhdGU6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gICAgbGV0IHNlYXJjaERhdGUgPSBcIipcIjtcblxuICAgIGlmIChkYXRlKSB7XG4gICAgICBjb25zdCBkYXRldGltZSA9IERhdGVUaW1lLmZyb21Gb3JtYXQoZGF0ZSwgXCJ5eXl5LU1NLWRkXCIpO1xuXG4gICAgICBpZiAoIWRhdGV0aW1lLmlzVmFsaWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGB1bmFibGUgdG8gcGFyc2UgZmxhZyBcIiR7ZmxhZ05hbWV9XCJcXG4ke2RhdGV0aW1lLmludmFsaWRFeHBsYW5hdGlvbn1gXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHNlYXJjaERhdGUgPSBkYXRldGltZS50b0lTT0RhdGUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2VhcmNoRGF0ZTtcbiAgfVxuXG4gIGFzeW5jIGluaXQoKSB7XG4gICAgY29uc3Qge1xuICAgICAgZmxhZ3M6IHsgYmFzZVVybCwgdG9rZW4gfSxcbiAgICAgIC8qXG4gICAgICAgKiBUaGVzZSBuZXh0IGxpbmVzIGFyZSByZXF1aXJlZCBmb3IgcGFyc2luZyBmbGFncyBvbiBjb21tYW5kc1xuICAgICAgICogdGhhdCBleHRlbmQgZnJvbSB0aGlzIGJhc2UgY2xhc3Mgc2luY2UgdGhlcmUgaXMgYSB0eXBlIG1pc21hdGNoXG4gICAgICAgKiBiZXR3ZWVuIHRoaXMucGFyc2UgYW5kIHRoaXMuY29uc3RydWN0b3IuXG4gICAgICAgKlxuICAgICAgICogU2VlIGBpbml0YCBpbiBodHRwczovL29jbGlmLmlvL2RvY3MvYmFzZV9jbGFzcyBzaG93aW5nIHRoYXQgaXMgdGhlXG4gICAgICAgKiByaWdodCB3YXkgZXZlbiB0aG91Z2ggd2UgaGF2ZSB0byBkaXNhYmxlIG91ciBsaW50ZXJcbiAgICAgICAqL1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9iYW4tdHMtaWdub3JlXG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgfSA9IHRoaXMucGFyc2UodGhpcy5jb25zdHJ1Y3Rvcik7XG5cbiAgICB0aGlzLmdpdGh1YiA9IG5ldyBPY3Rva2l0KHtcbiAgICAgIGJhc2VVcmwsXG4gICAgICBhdXRoOiB0b2tlbixcbiAgICAgIHJlcXVlc3Q6IHsgYWdlbnQ6IG5ldyBWQUFnZW50KCkgfSxcbiAgICB9KTtcbiAgfVxufVxuIl19