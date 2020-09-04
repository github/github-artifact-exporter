import { Window } from "./window";
import * as jsonexport from "jsonexport";
import * as dot from "dot-object";
import {
  Issue,
  IssueComment,
  getIssues,
  getComments,
  User,
  getIssuesWithComments,
} from "@github/github-exporter-core";
import * as VAAgent from "@github/agent";
import { retry } from "@octokit/plugin-retry";
import { Octokit } from "@octokit/rest";
import { app, BrowserWindow, ipcMain, dialog, Menu } from "electron";
import openAboutWindow from "about-window";
import * as fs from "fs";
import * as path from "path";
import * as winston from "winston";

const MyOctokit = Octokit.plugin(retry);

let prefix = "./";
let indexPath = "./lib/renderer/index.html";
let githubIcon = `${__dirname}/renderer/GitHub-Mark-120px-plus.png`;
let logger: winston.Logger;
const isPackaged =
  app.getAppPath().includes(".app") || app.getAppPath().includes("app.asar");
const isWindows =
  app.getAppPath().includes("app.asar") && !app.getAppPath().includes(".app");

if (isPackaged) {
  const lastIndex = app.getAppPath().lastIndexOf("app.asar");
  const str = app.getAppPath().substring(0, lastIndex);
  prefix = `${str}/`;
  indexPath = `${prefix}lib/renderer/index.html`;
  githubIcon = `${prefix}/lib/renderer/GitHub-Mark-120px-plus.png`;
  let logPath = `${prefix}../../../github-exporter.log`;
  if (isWindows) {
    logPath = `${prefix}../github-exporter.log`;
  }
  logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    defaultMeta: { service: "user-service" },
    transports: [new winston.transports.File({ filename: logPath })],
  });
} else {
  logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
  });
}

const isMac = process.platform === "darwin";
const template: any = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            { role: "hide" },
            { role: "hideothers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        },
      ]
    : []),
  {
    label: "File",
    submenu: [isMac ? { role: "close" } : { role: "quit" }],
  },
  {
    label: "Help",
    submenu: [
      {
        label: "About",
        click() {
          openAboutWindow({
            // eslint-disable-next-line @typescript-eslint/camelcase
            icon_path: githubIcon,
            // eslint-disable-next-line @typescript-eslint/camelcase
            bug_report_url: "https://github.com/github/github-exporter/issues",
            // eslint-disable-next-line @typescript-eslint/camelcase
            open_devtools: false,
            // eslint-disable-next-line @typescript-eslint/camelcase
            win_options: {
              webPreferences: {
                nodeIntegration: true,
              },
            },
          });
        },
      },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
      { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
      { type: "separator" },
      { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
      {
        label: "Select All",
        accelerator: "CmdOrCtrl+A",
        selector: "selectAll:",
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
logger.info("Starting Application");

let mainWindow: Window.MainWindow;

const main = () => {
  mainWindow = new Window.MainWindow(indexPath, {});
};

app.on("ready", main);
app.on("window-all-closed", () => {
  if (isMac) {
    app.quit();
  }
});
app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    main();
  }
});

ipcMain.on("submit-export", async (event: any, form: any) => {
  logger.info("Export Event Received");
  const file = await dialog.showSaveDialog({});

  if (!file.canceled) {
    if (!file.filePath) {
      logger.error("Filepath is required.");
      throw new Error("Filepath is required.");
    }
    logger.info(`Filepath requested: ${file.filePath}`);
    try {
      mainWindow.webContents.send("export-loading-start");

      let format = "";
      let jira = false;
      if (form.format.includes("jira")) {
        format = "CSV";
        jira = true;
      } else {
        format = form.format;
      }

      // fix filename
      if (!path.extname(file.filePath)) {
        file.filePath += `.${form.format.toLowerCase()}`;
      }
      logger.info(`Form received: ${JSON.stringify(form)}`);
      const client = new MyOctokit({
        auth: `token ${form.token}`,
        baseUrl: form.baseUrl,
        request: {
          retries: 3,
          agent: new VAAgent(),
        },
      });

      let searchQuery = [`is:issue`, `repo:${form.owner}/${form.repo}`];
      searchQuery = searchQuery.concat(form.search.split(" "));

      let issues: Issue[];

      const progressCallback = () => {
        /* TODO Implement callback to show progress to user */
      };

      try {
        issues = await getIssues(
          client,
          searchQuery.join(" "),
          progressCallback
        );
      } catch (error) {
        mainWindow.webContents.send("export-loading-stop");
        mainWindow.webContents.send(
          "export-error",
          `Error when searching issues: ${error}`
        );
        logger.error(error);
        return;
      }

      if (issues.length < 1) {
        mainWindow.webContents.send("export-loading-stop");
        mainWindow.webContents.send(
          "export-error",
          `No issues found with current search terms`
        );
        logger.error(`No issues found with current search terms`);
        return;
      }

      const issuesWithComments = getIssuesWithComments(issues);

      if (issuesWithComments.length > 0) {
        getComments(client, issuesWithComments, progressCallback);
      }

      const jiraFormatComments = (issue: Issue): void => {
        let i;
        for (i = 0; i < (issue.comments.nodes as IssueComment[]).length; i++) {
          const comment = (issue.comments.nodes as IssueComment[])[i];
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          issue[`comment${i}`] = [
            comment.createdAt,
            (comment.author as User).login,
            comment.body,
          ].join(";");
        }
      };

      for (const issue of issues) {
        if (jira) {
          // We have to do surgery on the Issue object
          jiraFormatComments(issue);
          dot.del("comments.nodes", issue);
        } else {
          dot.move("comments.nodes", "comments", issue);
        }

        dot.del("id", issue);
        dot.move("assignees.nodes", "assignees", issue);
        dot.move("labels.nodes", "labels", issue);

        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        issue.labels = issue.labels.map(({ name }) => name).join(", ");
      }

      if (format === "JSON") {
        fs.writeFileSync(file.filePath, JSON.stringify(issues));
      } else if (format === "CSV") {
        let mapHeaders: Function | null = null;

        if (jira) {
          // Jira expects all comments to have a header of just "comment"
          // so we map commment0, comment1, comment2 etc to comment
          mapHeaders = function (header: string) {
            return header.replace(/comment[0-9]+/, "comment");
          };
        }

        const csv = await jsonexport(issues, { fillGaps: true, mapHeaders });
        fs.writeFileSync(file.filePath, csv);
      }

      mainWindow.webContents.send("export-loading-stop");
      mainWindow.webContents.send(
        "export-success",
        `Export complete.  Results written to ${file.filePath}`
      );
    } catch (error) {
      mainWindow.webContents.send("export-loading-stop");
      mainWindow.webContents.send("export-failure", `Export failure: ${error}`);
      logger.error(error);
    }
  }
});
