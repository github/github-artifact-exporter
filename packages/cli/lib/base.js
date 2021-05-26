"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        options: ["JSONL", "JSON", "CSV"],
        default: "JSONL",
        description: "export format",
    }),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNENBQTZEO0FBRTdELHdDQUF3QztBQUN4QyxpQ0FBaUM7QUFFakMsTUFBOEIsSUFBSyxTQUFRLGlCQUFPO0lBQ2hELFlBQVksSUFBYyxFQUFFLE1BQWU7UUFDekMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUV0QixxREFBcUQ7UUFDckQsV0FBTSxHQUFZLElBQUksY0FBTyxFQUFFLENBQUM7SUFGaEMsQ0FBQztJQWlDRDs7Ozs7Ozs7T0FRRztJQUNILGFBQWEsQ0FBQyxRQUFnQixFQUFFLElBQXdCO1FBQ3RELElBQUksVUFBVSxHQUFHLEdBQUcsQ0FBQztRQUVyQixJQUFJLElBQUksRUFBRTtZQUNSLE1BQU0sUUFBUSxHQUFHLGdCQUFRLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQztZQUV6RCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtnQkFDckIsTUFBTSxJQUFJLEtBQUssQ0FDYix5QkFBeUIsUUFBUSxNQUFNLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxDQUNyRSxDQUFDO2FBQ0g7WUFFRCxVQUFVLEdBQUcsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO1NBQ25DO1FBRUQsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJO1FBQ1IsTUFBTSxFQUNKLEtBQUssRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsR0FXMUIsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUVqQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksY0FBTyxDQUFDO1lBQ3hCLE9BQU87WUFDUCxJQUFJLEVBQUUsS0FBSztTQUNaLENBQUMsQ0FBQztJQUNMLENBQUM7O0FBbEZILHVCQW1GQztBQTVFUSxVQUFLLEdBQUc7SUFDYixPQUFPLEVBQUUsZUFBUyxDQUFDLE1BQU0sQ0FBQztRQUN4QixXQUFXLEVBQUUsaUJBQWlCO1FBQzlCLE9BQU8sRUFBRSx3QkFBd0I7S0FDbEMsQ0FBQztJQUVGLEtBQUssRUFBRSxlQUFTLENBQUMsTUFBTSxDQUFDO1FBQ3RCLFdBQVcsRUFBRSw4QkFBOEI7UUFDM0MsR0FBRyxFQUFFLGNBQWM7UUFDbkIsUUFBUSxFQUFFLElBQUk7S0FDZixDQUFDO0lBRUYsS0FBSyxFQUFFLGVBQVMsQ0FBQyxNQUFNLENBQUM7UUFDdEIsU0FBUyxFQUFFLENBQUMsTUFBTSxDQUFDO1FBQ25CLFdBQVcsRUFBRSx5QkFBeUI7S0FDdkMsQ0FBQztJQUVGLElBQUksRUFBRSxlQUFTLENBQUMsTUFBTSxDQUFDO1FBQ3JCLFNBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUNwQixXQUFXLEVBQUUsd0JBQXdCO0tBQ3RDLENBQUM7SUFFRixNQUFNLEVBQUUsZUFBUyxDQUFDLElBQUksQ0FBQztRQUNyQixPQUFPLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDO1FBQ3hCLE9BQU8sRUFBRSxNQUFNO1FBQ2YsV0FBVyxFQUFFLGVBQWU7S0FDN0IsQ0FBQztDQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQ29tbWFuZCwgeyBmbGFncyBhcyBmbGFnVHlwZXMgfSBmcm9tIFwiQG9jbGlmL2NvbW1hbmRcIjtcbmltcG9ydCB7IElDb25maWcgfSBmcm9tIFwiQG9jbGlmL2NvbmZpZ1wiO1xuaW1wb3J0IHsgT2N0b2tpdCB9IGZyb20gXCJAb2N0b2tpdC9yZXN0XCI7XG5pbXBvcnQgeyBEYXRlVGltZSB9IGZyb20gXCJsdXhvblwiO1xuXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBCYXNlIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGFyZ3Y6IHN0cmluZ1tdLCBjb25maWc6IElDb25maWcpIHtcbiAgICBzdXBlcihhcmd2LCBjb25maWcpO1xuICB9XG4gIC8vIHRoaXMgaXMgaW1tZWRpYXRlbHkgb3ZlcndyaXR0ZW4gaW4gdGhlIGluaXQgbWV0aG9kXG4gIGdpdGh1YjogT2N0b2tpdCA9IG5ldyBPY3Rva2l0KCk7XG5cbiAgc3RhdGljIGZsYWdzID0ge1xuICAgIGJhc2VVcmw6IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVzY3JpcHRpb246IFwiR2l0SHViIGJhc2UgdXJsXCIsXG4gICAgICBkZWZhdWx0OiBcImh0dHBzOi8vYXBpLmdpdGh1Yi5jb21cIixcbiAgICB9KSxcblxuICAgIHRva2VuOiBmbGFnVHlwZXMuc3RyaW5nKHtcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkdpdEh1YiBwZXJzb25hbCBhY2Nlc3MgdG9rZW5cIixcbiAgICAgIGVudjogXCJHSVRIVUJfVE9LRU5cIixcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIH0pLFxuXG4gICAgb3duZXI6IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVwZW5kc09uOiBbXCJyZXBvXCJdLFxuICAgICAgZGVzY3JpcHRpb246IFwiR2l0SHViIHJlcG9zaXRvcnkgb3duZXJcIixcbiAgICB9KSxcblxuICAgIHJlcG86IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVwZW5kc09uOiBbXCJvd25lclwiXSxcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkdpdEh1YiByZXBvc2l0b3J5IG5hbWVcIixcbiAgICB9KSxcblxuICAgIGZvcm1hdDogZmxhZ1R5cGVzLmVudW0oe1xuICAgICAgb3B0aW9uczogW1wiSlNPTlwiLCBcIkNTVlwiXSxcbiAgICAgIGRlZmF1bHQ6IFwiSlNPTlwiLFxuICAgICAgZGVzY3JpcHRpb246IFwiZXhwb3J0IGZvcm1hdFwiLFxuICAgIH0pLFxuICB9O1xuXG4gIC8qKlxuICAgKiBQYXJzZSBkYXRlIGludG8gSVNPIG9yIFwiKlwiIGlmIG51bGwvdW5kZWZpbmVkIHRoaXNcbiAgICogYWxsb3dzIGl0IHRvIGJlIHVzZWQgd2l0aCB0aGUgYGNyZWF0ZWRgIGZpbHRlclxuICAgKiBmb3IgR2l0SHViIFNlYXJjaFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmxhZ05hbWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGVcbiAgICogQHJldHVybnMge3N0cmluZ31cbiAgICovXG4gIHBhcnNlRGF0ZUZsYWcoZmxhZ05hbWU6IHN0cmluZywgZGF0ZTogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgICBsZXQgc2VhcmNoRGF0ZSA9IFwiKlwiO1xuXG4gICAgaWYgKGRhdGUpIHtcbiAgICAgIGNvbnN0IGRhdGV0aW1lID0gRGF0ZVRpbWUuZnJvbUZvcm1hdChkYXRlLCBcInl5eXktTU0tZGRcIik7XG5cbiAgICAgIGlmICghZGF0ZXRpbWUuaXNWYWxpZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYHVuYWJsZSB0byBwYXJzZSBmbGFnIFwiJHtmbGFnTmFtZX1cIlxcbiR7ZGF0ZXRpbWUuaW52YWxpZEV4cGxhbmF0aW9ufWBcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgc2VhcmNoRGF0ZSA9IGRhdGV0aW1lLnRvSVNPRGF0ZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBzZWFyY2hEYXRlO1xuICB9XG5cbiAgYXN5bmMgaW5pdCgpIHtcbiAgICBjb25zdCB7XG4gICAgICBmbGFnczogeyBiYXNlVXJsLCB0b2tlbiB9LFxuICAgICAgLypcbiAgICAgICAqIFRoZXNlIG5leHQgbGluZXMgYXJlIHJlcXVpcmVkIGZvciBwYXJzaW5nIGZsYWdzIG9uIGNvbW1hbmRzXG4gICAgICAgKiB0aGF0IGV4dGVuZCBmcm9tIHRoaXMgYmFzZSBjbGFzcyBzaW5jZSB0aGVyZSBpcyBhIHR5cGUgbWlzbWF0Y2hcbiAgICAgICAqIGJldHdlZW4gdGhpcy5wYXJzZSBhbmQgdGhpcy5jb25zdHJ1Y3Rvci5cbiAgICAgICAqXG4gICAgICAgKiBTZWUgYGluaXRgIGluIGh0dHBzOi8vb2NsaWYuaW8vZG9jcy9iYXNlX2NsYXNzIHNob3dpbmcgdGhhdCBpcyB0aGVcbiAgICAgICAqIHJpZ2h0IHdheSBldmVuIHRob3VnaCB3ZSBoYXZlIHRvIGRpc2FibGUgb3VyIGxpbnRlclxuICAgICAgICovXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2Jhbi10cy1pZ25vcmVcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICB9ID0gdGhpcy5wYXJzZSh0aGlzLmNvbnN0cnVjdG9yKTtcblxuICAgIHRoaXMuZ2l0aHViID0gbmV3IE9jdG9raXQoe1xuICAgICAgYmFzZVVybCxcbiAgICAgIGF1dGg6IHRva2VuLFxuICAgIH0pO1xuICB9XG59XG4iXX0=