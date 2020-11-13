"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const utils_1 = require("./utils");
tslib_1.__exportStar(require("./github"), exports);
tslib_1.__exportStar(require("./utils"), exports);
/**
 * searchIssues
 *
 * @param github
 * @param searchQuery
 */
function searchIssues(github, searchQuery) {
    return tslib_1.__asyncGenerator(this, arguments, function* searchIssues_1() {
        let endCursor = null;
        let hasNextPage = false;
        const query = utils_1.loadQuery("searchIssues");
        do {
            const results = yield tslib_1.__await(github.graphql(query, {
                searchQuery,
                after: endCursor,
            }));
            endCursor = results.search.pageInfo.endCursor;
            hasNextPage = results.search.pageInfo.hasNextPage;
            yield yield tslib_1.__await(results);
        } while (hasNextPage);
    });
}
exports.searchIssues = searchIssues;
async function getIssues(github, searchQuery, progressCallback) {
    var e_1, _a;
    const issues = [];
    const issueIterator = searchIssues(github, searchQuery);
    try {
        for (var issueIterator_1 = tslib_1.__asyncValues(issueIterator), issueIterator_1_1; issueIterator_1_1 = await issueIterator_1.next(), !issueIterator_1_1.done;) {
            const result = issueIterator_1_1.value;
            progressCallback(result);
            issues.push(...result.search.nodes);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (issueIterator_1_1 && !issueIterator_1_1.done && (_a = issueIterator_1.return)) await _a.call(issueIterator_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return issues;
}
exports.getIssues = getIssues;
async function getComments(github, issues, progressCallback) {
    const fetchComments = async (issue) => {
        var e_2, _a;
        const commentIterator = listComments(github, issue.id);
        try {
            for (var commentIterator_1 = tslib_1.__asyncValues(commentIterator), commentIterator_1_1; commentIterator_1_1 = await commentIterator_1.next(), !commentIterator_1_1.done;) {
                const result = commentIterator_1_1.value;
                let nodes;
                if (issue.comments.nodes) {
                    nodes = issue.comments.nodes;
                }
                else {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                    // @ts-ignore
                    nodes = issue.comments;
                }
                nodes.push(...result.node.comments.nodes);
                progressCallback(result);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (commentIterator_1_1 && !commentIterator_1_1.done && (_a = commentIterator_1.return)) await _a.call(commentIterator_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
    const promises = issues.map((issue) => fetchComments(issue));
    await Promise.all(promises);
}
exports.getComments = getComments;
/**
 * listComments
 *
 * @param github
 * @param issueId
 */
function listComments(github, issueId) {
    return tslib_1.__asyncGenerator(this, arguments, function* listComments_1() {
        let endCursor = null;
        let hasNextPage = false;
        const query = utils_1.loadQuery("listIssueComments");
        do {
            const results = yield tslib_1.__await(github.graphql(query, {
                id: issueId,
                after: endCursor,
            }));
            endCursor = results.node.comments.pageInfo.endCursor;
            hasNextPage = results.node.comments.pageInfo.hasNextPage;
            yield yield tslib_1.__await(results);
        } while (hasNextPage);
    });
}
exports.listComments = listComments;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQU9BLG1DQUFvQztBQUVwQyxtREFBeUI7QUFDekIsa0RBQXdCO0FBRXhCOzs7OztHQUtHO0FBQ0gsU0FBdUIsWUFBWSxDQUFDLE1BQWUsRUFBRSxXQUFtQjs7UUFDdEUsSUFBSSxTQUFTLEdBQThCLElBQUksQ0FBQztRQUNoRCxJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7UUFFeEIsTUFBTSxLQUFLLEdBQUcsaUJBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUV4QyxHQUFHO1lBQ0QsTUFBTSxPQUFPLEdBQXNCLHNCQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFO2dCQUM3RCxXQUFXO2dCQUNYLEtBQUssRUFBRSxTQUFTO2FBQ2pCLENBQUMsQ0FBQSxDQUFDO1lBRUgsU0FBUyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQztZQUM5QyxXQUFXLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDO1lBRWxELDRCQUFNLE9BQU8sQ0FBQSxDQUFDO1NBQ2YsUUFBUSxXQUFXLEVBQUU7SUFDeEIsQ0FBQztDQUFBO0FBakJELG9DQWlCQztBQUVNLEtBQUssVUFBVSxTQUFTLENBQzdCLE1BQWUsRUFDZixXQUFtQixFQUNuQixnQkFBMEI7O0lBRTFCLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNsQixNQUFNLGFBQWEsR0FBRyxZQUFZLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDOztRQUV4RCxLQUEyQixJQUFBLGtCQUFBLHNCQUFBLGFBQWEsQ0FBQSxtQkFBQTtZQUE3QixNQUFNLE1BQU0sMEJBQUEsQ0FBQTtZQUNyQixnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUV6QixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFpQixDQUFDLENBQUM7U0FDbEQ7Ozs7Ozs7OztJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFkRCw4QkFjQztBQUVNLEtBQUssVUFBVSxXQUFXLENBQy9CLE1BQWUsRUFDZixNQUFlLEVBQ2YsZ0JBQTBCO0lBRTFCLE1BQU0sYUFBYSxHQUFHLEtBQUssRUFBRSxLQUFZLEVBQWlCLEVBQUU7O1FBQzFELE1BQU0sZUFBZSxHQUFHLFlBQVksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDOztZQUV2RCxLQUEyQixJQUFBLG9CQUFBLHNCQUFBLGVBQWUsQ0FBQSxxQkFBQTtnQkFBL0IsTUFBTSxNQUFNLDRCQUFBLENBQUE7Z0JBQ3JCLElBQUksS0FBcUIsQ0FBQztnQkFDMUIsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRTtvQkFDeEIsS0FBSyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBdUIsQ0FBQztpQkFDaEQ7cUJBQU07b0JBQ0wsNERBQTREO29CQUM1RCxhQUFhO29CQUNiLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBMEIsQ0FBQztpQkFDMUM7Z0JBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFLLE1BQU0sQ0FBQyxJQUFjLENBQUMsUUFBUSxDQUFDLEtBQXdCLENBQUMsQ0FBQztnQkFDekUsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDMUI7Ozs7Ozs7OztJQUNILENBQUMsQ0FBQztJQUVGLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFZLEVBQUUsRUFBRSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBRXBFLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUM5QixDQUFDO0FBekJELGtDQXlCQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBdUIsWUFBWSxDQUFDLE1BQWUsRUFBRSxPQUFlOztRQUNsRSxJQUFJLFNBQVMsR0FBOEIsSUFBSSxDQUFDO1FBQ2hELElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztRQUV4QixNQUFNLEtBQUssR0FBRyxpQkFBUyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFFN0MsR0FBRztZQUNELE1BQU0sT0FBTyxHQUEyQixzQkFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtnQkFDbEUsRUFBRSxFQUFFLE9BQU87Z0JBQ1gsS0FBSyxFQUFFLFNBQVM7YUFDakIsQ0FBQyxDQUFBLENBQUM7WUFFSCxTQUFTLEdBQUksT0FBTyxDQUFDLElBQWMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQztZQUNoRSxXQUFXLEdBQUksT0FBTyxDQUFDLElBQWMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQztZQUVwRSw0QkFBTSxPQUFPLENBQUEsQ0FBQztTQUNmLFFBQVEsV0FBVyxFQUFFO0lBQ3hCLENBQUM7Q0FBQTtBQWpCRCxvQ0FpQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPY3Rva2l0IH0gZnJvbSBcIkBvY3Rva2l0L3Jlc3RcIjtcbmltcG9ydCB7XG4gIElzc3VlLFxuICBJc3N1ZUNvbW1lbnQsXG4gIExpc3RJc3N1ZUNvbW1lbnRzUXVlcnksXG4gIFNlYXJjaElzc3Vlc1F1ZXJ5LFxufSBmcm9tIFwiLi9naXRodWJcIjtcbmltcG9ydCB7IGxvYWRRdWVyeSB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmV4cG9ydCAqIGZyb20gXCIuL2dpdGh1YlwiO1xuZXhwb3J0ICogZnJvbSBcIi4vdXRpbHNcIjtcblxuLyoqXG4gKiBzZWFyY2hJc3N1ZXNcbiAqXG4gKiBAcGFyYW0gZ2l0aHViXG4gKiBAcGFyYW0gc2VhcmNoUXVlcnlcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uKiBzZWFyY2hJc3N1ZXMoZ2l0aHViOiBPY3Rva2l0LCBzZWFyY2hRdWVyeTogc3RyaW5nKSB7XG4gIGxldCBlbmRDdXJzb3I6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQgPSBudWxsO1xuICBsZXQgaGFzTmV4dFBhZ2UgPSBmYWxzZTtcblxuICBjb25zdCBxdWVyeSA9IGxvYWRRdWVyeShcInNlYXJjaElzc3Vlc1wiKTtcblxuICBkbyB7XG4gICAgY29uc3QgcmVzdWx0czogU2VhcmNoSXNzdWVzUXVlcnkgPSBhd2FpdCBnaXRodWIuZ3JhcGhxbChxdWVyeSwge1xuICAgICAgc2VhcmNoUXVlcnksXG4gICAgICBhZnRlcjogZW5kQ3Vyc29yLFxuICAgIH0pO1xuXG4gICAgZW5kQ3Vyc29yID0gcmVzdWx0cy5zZWFyY2gucGFnZUluZm8uZW5kQ3Vyc29yO1xuICAgIGhhc05leHRQYWdlID0gcmVzdWx0cy5zZWFyY2gucGFnZUluZm8uaGFzTmV4dFBhZ2U7XG5cbiAgICB5aWVsZCByZXN1bHRzO1xuICB9IHdoaWxlIChoYXNOZXh0UGFnZSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRJc3N1ZXMoXG4gIGdpdGh1YjogT2N0b2tpdCxcbiAgc2VhcmNoUXVlcnk6IHN0cmluZyxcbiAgcHJvZ3Jlc3NDYWxsYmFjazogRnVuY3Rpb25cbik6IFByb21pc2U8SXNzdWVbXT4ge1xuICBjb25zdCBpc3N1ZXMgPSBbXTtcbiAgY29uc3QgaXNzdWVJdGVyYXRvciA9IHNlYXJjaElzc3VlcyhnaXRodWIsIHNlYXJjaFF1ZXJ5KTtcblxuICBmb3IgYXdhaXQgKGNvbnN0IHJlc3VsdCBvZiBpc3N1ZUl0ZXJhdG9yKSB7XG4gICAgcHJvZ3Jlc3NDYWxsYmFjayhyZXN1bHQpO1xuXG4gICAgaXNzdWVzLnB1c2goLi4uKHJlc3VsdC5zZWFyY2gubm9kZXMgYXMgSXNzdWVbXSkpO1xuICB9XG4gIHJldHVybiBpc3N1ZXM7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb21tZW50cyhcbiAgZ2l0aHViOiBPY3Rva2l0LFxuICBpc3N1ZXM6IElzc3VlW10sXG4gIHByb2dyZXNzQ2FsbGJhY2s6IEZ1bmN0aW9uXG4pIHtcbiAgY29uc3QgZmV0Y2hDb21tZW50cyA9IGFzeW5jIChpc3N1ZTogSXNzdWUpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICBjb25zdCBjb21tZW50SXRlcmF0b3IgPSBsaXN0Q29tbWVudHMoZ2l0aHViLCBpc3N1ZS5pZCk7XG5cbiAgICBmb3IgYXdhaXQgKGNvbnN0IHJlc3VsdCBvZiBjb21tZW50SXRlcmF0b3IpIHtcbiAgICAgIGxldCBub2RlczogSXNzdWVDb21tZW50W107XG4gICAgICBpZiAoaXNzdWUuY29tbWVudHMubm9kZXMpIHtcbiAgICAgICAgbm9kZXMgPSBpc3N1ZS5jb21tZW50cy5ub2RlcyBhcyBJc3N1ZUNvbW1lbnRbXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvYmFuLXRzLWlnbm9yZVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIG5vZGVzID0gaXNzdWUuY29tbWVudHMgYXMgSXNzdWVDb21tZW50W107XG4gICAgICB9XG4gICAgICBub2Rlcy5wdXNoKC4uLigocmVzdWx0Lm5vZGUgYXMgSXNzdWUpLmNvbW1lbnRzLm5vZGVzIGFzIElzc3VlQ29tbWVudFtdKSk7XG4gICAgICBwcm9ncmVzc0NhbGxiYWNrKHJlc3VsdCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHByb21pc2VzID0gaXNzdWVzLm1hcCgoaXNzdWU6IElzc3VlKSA9PiBmZXRjaENvbW1lbnRzKGlzc3VlKSk7XG5cbiAgYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xufVxuXG4vKipcbiAqIGxpc3RDb21tZW50c1xuICpcbiAqIEBwYXJhbSBnaXRodWJcbiAqIEBwYXJhbSBpc3N1ZUlkXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogbGlzdENvbW1lbnRzKGdpdGh1YjogT2N0b2tpdCwgaXNzdWVJZDogc3RyaW5nKSB7XG4gIGxldCBlbmRDdXJzb3I6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQgPSBudWxsO1xuICBsZXQgaGFzTmV4dFBhZ2UgPSBmYWxzZTtcblxuICBjb25zdCBxdWVyeSA9IGxvYWRRdWVyeShcImxpc3RJc3N1ZUNvbW1lbnRzXCIpO1xuXG4gIGRvIHtcbiAgICBjb25zdCByZXN1bHRzOiBMaXN0SXNzdWVDb21tZW50c1F1ZXJ5ID0gYXdhaXQgZ2l0aHViLmdyYXBocWwocXVlcnksIHtcbiAgICAgIGlkOiBpc3N1ZUlkLFxuICAgICAgYWZ0ZXI6IGVuZEN1cnNvcixcbiAgICB9KTtcblxuICAgIGVuZEN1cnNvciA9IChyZXN1bHRzLm5vZGUgYXMgSXNzdWUpLmNvbW1lbnRzLnBhZ2VJbmZvLmVuZEN1cnNvcjtcbiAgICBoYXNOZXh0UGFnZSA9IChyZXN1bHRzLm5vZGUgYXMgSXNzdWUpLmNvbW1lbnRzLnBhZ2VJbmZvLmhhc05leHRQYWdlO1xuXG4gICAgeWllbGQgcmVzdWx0cztcbiAgfSB3aGlsZSAoaGFzTmV4dFBhZ2UpO1xufVxuIl19