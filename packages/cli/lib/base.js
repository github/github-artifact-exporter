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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNENBQTZEO0FBRTdELHdDQUF3QztBQUN4QyxpQ0FBaUM7QUFFakMsTUFBOEIsSUFBSyxTQUFRLGlCQUFPO0lBQ2hELFlBQVksSUFBYyxFQUFFLE1BQWU7UUFDekMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUV0QixxREFBcUQ7UUFDckQsV0FBTSxHQUFZLElBQUksY0FBTyxFQUFFLENBQUM7SUFGaEMsQ0FBQztJQWlDRDs7Ozs7Ozs7T0FRRztJQUNILGFBQWEsQ0FBQyxRQUFnQixFQUFFLElBQXdCO1FBQ3RELElBQUksVUFBVSxHQUFHLEdBQUcsQ0FBQztRQUVyQixJQUFJLElBQUksRUFBRTtZQUNSLE1BQU0sUUFBUSxHQUFHLGdCQUFRLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQztZQUV6RCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtnQkFDckIsTUFBTSxJQUFJLEtBQUssQ0FDYix5QkFBeUIsUUFBUSxNQUFNLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxDQUNyRSxDQUFDO2FBQ0g7WUFFRCxVQUFVLEdBQUcsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO1NBQ25DO1FBRUQsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJO1FBQ1IsTUFBTSxFQUNKLEtBQUssRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsR0FXMUIsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUVqQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksY0FBTyxDQUFDO1lBQ3hCLE9BQU87WUFDUCxJQUFJLEVBQUUsS0FBSztTQUNaLENBQUMsQ0FBQztJQUNMLENBQUM7O0FBbEZILHVCQW1GQztBQTVFUSxVQUFLLEdBQUc7SUFDYixPQUFPLEVBQUUsZUFBUyxDQUFDLE1BQU0sQ0FBQztRQUN4QixXQUFXLEVBQUUsaUJBQWlCO1FBQzlCLE9BQU8sRUFBRSx3QkFBd0I7S0FDbEMsQ0FBQztJQUVGLEtBQUssRUFBRSxlQUFTLENBQUMsTUFBTSxDQUFDO1FBQ3RCLFdBQVcsRUFBRSw4QkFBOEI7UUFDM0MsR0FBRyxFQUFFLGNBQWM7UUFDbkIsUUFBUSxFQUFFLElBQUk7S0FDZixDQUFDO0lBRUYsS0FBSyxFQUFFLGVBQVMsQ0FBQyxNQUFNLENBQUM7UUFDdEIsU0FBUyxFQUFFLENBQUMsTUFBTSxDQUFDO1FBQ25CLFdBQVcsRUFBRSx5QkFBeUI7S0FDdkMsQ0FBQztJQUVGLElBQUksRUFBRSxlQUFTLENBQUMsTUFBTSxDQUFDO1FBQ3JCLFNBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUNwQixXQUFXLEVBQUUsd0JBQXdCO0tBQ3RDLENBQUM7SUFFRixNQUFNLEVBQUUsZUFBUyxDQUFDLElBQUksQ0FBQztRQUNyQixPQUFPLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQztRQUNqQyxPQUFPLEVBQUUsT0FBTztRQUNoQixXQUFXLEVBQUUsZUFBZTtLQUM3QixDQUFDO0NBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBDb21tYW5kLCB7IGZsYWdzIGFzIGZsYWdUeXBlcyB9IGZyb20gXCJAb2NsaWYvY29tbWFuZFwiO1xuaW1wb3J0IHsgSUNvbmZpZyB9IGZyb20gXCJAb2NsaWYvY29uZmlnXCI7XG5pbXBvcnQgeyBPY3Rva2l0IH0gZnJvbSBcIkBvY3Rva2l0L3Jlc3RcIjtcbmltcG9ydCB7IERhdGVUaW1lIH0gZnJvbSBcImx1eG9uXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGFic3RyYWN0IGNsYXNzIEJhc2UgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoYXJndjogc3RyaW5nW10sIGNvbmZpZzogSUNvbmZpZykge1xuICAgIHN1cGVyKGFyZ3YsIGNvbmZpZyk7XG4gIH1cbiAgLy8gdGhpcyBpcyBpbW1lZGlhdGVseSBvdmVyd3JpdHRlbiBpbiB0aGUgaW5pdCBtZXRob2RcbiAgZ2l0aHViOiBPY3Rva2l0ID0gbmV3IE9jdG9raXQoKTtcblxuICBzdGF0aWMgZmxhZ3MgPSB7XG4gICAgYmFzZVVybDogZmxhZ1R5cGVzLnN0cmluZyh7XG4gICAgICBkZXNjcmlwdGlvbjogXCJHaXRIdWIgYmFzZSB1cmxcIixcbiAgICAgIGRlZmF1bHQ6IFwiaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbVwiLFxuICAgIH0pLFxuXG4gICAgdG9rZW46IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVzY3JpcHRpb246IFwiR2l0SHViIHBlcnNvbmFsIGFjY2VzcyB0b2tlblwiLFxuICAgICAgZW52OiBcIkdJVEhVQl9UT0tFTlwiLFxuICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgfSksXG5cbiAgICBvd25lcjogZmxhZ1R5cGVzLnN0cmluZyh7XG4gICAgICBkZXBlbmRzT246IFtcInJlcG9cIl0sXG4gICAgICBkZXNjcmlwdGlvbjogXCJHaXRIdWIgcmVwb3NpdG9yeSBvd25lclwiLFxuICAgIH0pLFxuXG4gICAgcmVwbzogZmxhZ1R5cGVzLnN0cmluZyh7XG4gICAgICBkZXBlbmRzT246IFtcIm93bmVyXCJdLFxuICAgICAgZGVzY3JpcHRpb246IFwiR2l0SHViIHJlcG9zaXRvcnkgbmFtZVwiLFxuICAgIH0pLFxuXG4gICAgZm9ybWF0OiBmbGFnVHlwZXMuZW51bSh7XG4gICAgICBvcHRpb25zOiBbXCJKU09OTFwiLCBcIkpTT05cIiwgXCJDU1ZcIl0sXG4gICAgICBkZWZhdWx0OiBcIkpTT05MXCIsXG4gICAgICBkZXNjcmlwdGlvbjogXCJleHBvcnQgZm9ybWF0XCIsXG4gICAgfSksXG4gIH07XG5cbiAgLyoqXG4gICAqIFBhcnNlIGRhdGUgaW50byBJU08gb3IgXCIqXCIgaWYgbnVsbC91bmRlZmluZWQgdGhpc1xuICAgKiBhbGxvd3MgaXQgdG8gYmUgdXNlZCB3aXRoIHRoZSBgY3JlYXRlZGAgZmlsdGVyXG4gICAqIGZvciBHaXRIdWIgU2VhcmNoXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmbGFnTmFtZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0ZVxuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgKi9cbiAgcGFyc2VEYXRlRmxhZyhmbGFnTmFtZTogc3RyaW5nLCBkYXRlOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICAgIGxldCBzZWFyY2hEYXRlID0gXCIqXCI7XG5cbiAgICBpZiAoZGF0ZSkge1xuICAgICAgY29uc3QgZGF0ZXRpbWUgPSBEYXRlVGltZS5mcm9tRm9ybWF0KGRhdGUsIFwieXl5eS1NTS1kZFwiKTtcblxuICAgICAgaWYgKCFkYXRldGltZS5pc1ZhbGlkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgdW5hYmxlIHRvIHBhcnNlIGZsYWcgXCIke2ZsYWdOYW1lfVwiXFxuJHtkYXRldGltZS5pbnZhbGlkRXhwbGFuYXRpb259YFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBzZWFyY2hEYXRlID0gZGF0ZXRpbWUudG9JU09EYXRlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlYXJjaERhdGU7XG4gIH1cblxuICBhc3luYyBpbml0KCkge1xuICAgIGNvbnN0IHtcbiAgICAgIGZsYWdzOiB7IGJhc2VVcmwsIHRva2VuIH0sXG4gICAgICAvKlxuICAgICAgICogVGhlc2UgbmV4dCBsaW5lcyBhcmUgcmVxdWlyZWQgZm9yIHBhcnNpbmcgZmxhZ3Mgb24gY29tbWFuZHNcbiAgICAgICAqIHRoYXQgZXh0ZW5kIGZyb20gdGhpcyBiYXNlIGNsYXNzIHNpbmNlIHRoZXJlIGlzIGEgdHlwZSBtaXNtYXRjaFxuICAgICAgICogYmV0d2VlbiB0aGlzLnBhcnNlIGFuZCB0aGlzLmNvbnN0cnVjdG9yLlxuICAgICAgICpcbiAgICAgICAqIFNlZSBgaW5pdGAgaW4gaHR0cHM6Ly9vY2xpZi5pby9kb2NzL2Jhc2VfY2xhc3Mgc2hvd2luZyB0aGF0IGlzIHRoZVxuICAgICAgICogcmlnaHQgd2F5IGV2ZW4gdGhvdWdoIHdlIGhhdmUgdG8gZGlzYWJsZSBvdXIgbGludGVyXG4gICAgICAgKi9cbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvYmFuLXRzLWlnbm9yZVxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgIH0gPSB0aGlzLnBhcnNlKHRoaXMuY29uc3RydWN0b3IpO1xuXG4gICAgdGhpcy5naXRodWIgPSBuZXcgT2N0b2tpdCh7XG4gICAgICBiYXNlVXJsLFxuICAgICAgYXV0aDogdG9rZW4sXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==