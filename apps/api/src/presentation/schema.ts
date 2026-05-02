export const typeDefs = /* GraphQL */ `
  type Query {
    healthCheck: String!
    me: User
    listOpenBattles: [Battle!]!
    getBattle(battleId: ID!): Battle
    listRanking(by: RankingType!, limit: Int = 100): [RankingEntry!]!
  }

  type Mutation {
    signup(email: String!, password: String!, nickname: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createBattle(input: CreateBattleInput!): Battle!
    joinBattle(battleId: ID!): Battle!
    requestUploadUrl(battleId: ID!): UploadUrl!
    submitScore(battleId: ID!, s3Key: String!): SubmitResult!
    sendStamp(battleId: ID!, type: StampType!): Stamp!
  }

  type Subscription {
    onBattleUpdated(battleId: ID!): Battle!
    onStampSent(battleId: ID!): Stamp!
  }

  type User {
    id: ID!
    email: String!
    nickname: String!
    rate: Int!
    wins: Int!
    losses: Int!
    draws: Int!
    bestScore: Float
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  enum BattleStatus {
    WAITING
    MATCHED
    P1_SUBMITTED
    P2_SUBMITTED
    JUDGING
    COMPLETED
    DISPUTED
  }

  type Battle {
    id: ID!
    code: String!
    title: String!
    memo: String
    status: BattleStatus!
    creatorId: ID!
    opponentId: ID
    creator: User
    opponent: User
    submissions: [Submission!]!
    winnerId: ID
    createdAt: String!
    updatedAt: String!
  }

  type Submission {
    userId: ID!
    score: Float!
    songName: String
    submittedAt: String!
  }

  input CreateBattleInput {
    title: String!
    memo: String
  }

  type UploadUrl {
    url: String!
    s3Key: String!
  }

  type SubmitResult {
    battle: Battle!
    submittedScore: Float!
    songName: String
  }

  enum StampType {
    LET_S_GO
    NICE
    WIN_GUARANTEED
  }

  type Stamp {
    battleId: ID!
    userId: ID!
    type: StampType!
    sentAt: String!
  }

  enum RankingType {
    RATE
    WINS
    BEST_SCORE
  }

  type RankingEntry {
    rank: Int!
    user: User!
  }
`;
