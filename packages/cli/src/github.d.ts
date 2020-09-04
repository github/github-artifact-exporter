export interface Connection<T> {
  totalCount: number;
  nodes: [T];
  pageInfo: {
    endCursor: string;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
  };
}

export interface SearchResults<T> {
  search: {
    issueCount: number;
    nodes: [T];
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
    };
  };
}

export interface Actor {
  login: string;
}

export interface IssueComment {
  author: Actor;
  body: string;
  createdAt: string;
}

export interface Label {
  name: string;
}

export enum IssueState {
  CLOSED,
  OPEN,
}

export interface Issue {
  assignees: Connection<Actor>;
  author: Actor;
  comments: Connection<IssueComment>;
  createdAt: string;
  id: string;
  labels: Connection<Label>;
  state: IssueState;
  title: string;
  updatedAt: string;
  milestone: Milestone;
  closedAt: string;
}

export interface CommentsList {
  node: {
    comments: Connection<IssueComment>;
  };
}

export interface RepositoryReleases {
  repository: {
    releases: Connection<Release>;
  };
}

export interface Release {
  author: Actor;
  createdAt: string;
  description: string;
  id: string;
  isDraft: boolean;
  isPrerelease: boolean;
  name: string;
  publishedAt: string;
  shortDescriptionHTML: string;
  tagName: string;
  updatedAt: string;
}

export interface RepositoryMilestones {
  repository: {
    milestones: Connection<Milestone>;
  };
}

export interface Milestone {
  closed: string;
  closedAt: string;
  createdAt: string;
  creator: {
    login: string;
  };
  description: string;
  dueOn: string;
  id: string;
  issuePrioritiesDebug: string;
  number: string;
  state: string;
  title: string;
  updatedAt: string;
}

export interface RepositoryCommits {
  repository: {
    ref: {
      name: string;
      target: {
        history: Connection<Commit>;
      };
    };
  };
}

export interface Commit {
  author: {
    name: string;
    email: string;
  };
  additions: number;
  associatedPullRequests: {
    nodes: {
      title: string;
      url: string;
    };
  };
  messageHeadline: string;
}

export interface RepositoryPullRequests {
  repository: {
    pullRequests: Connection<PullRequest>;
  };
}

export interface PullRequest extends Issue {
  reviewDecision: string;
  merged: boolean;
  mergedAt: string;
  mergedBy: Actor;
}
