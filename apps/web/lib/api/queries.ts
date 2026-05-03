import { gql } from "@apollo/client";

export const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id
    email
    nickname
    rate
    wins
    losses
    draws
    bestScore
  }
`;

export const BATTLE_FRAGMENT = gql`
  fragment BattleFields on Battle {
    id
    code
    title
    memo
    status
    creatorId
    opponentId
    creator {
      ...UserFields
    }
    opponent {
      ...UserFields
    }
    submissions {
      userId
      score
      songName
      submittedAt
    }
    winnerId
    createdAt
    updatedAt
  }
  ${USER_FRAGMENT}
`;

export const SIGNUP = gql`
  mutation Signup($email: String!, $password: String!, $nickname: String!) {
    signup(email: $email, password: $password, nickname: $nickname) {
      token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FRAGMENT}
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FRAGMENT}
`;

export const ME = gql`
  query Me {
    me {
      ...UserFields
    }
  }
  ${USER_FRAGMENT}
`;

export const LIST_OPEN_BATTLES = gql`
  query ListOpenBattles {
    listOpenBattles {
      ...BattleFields
    }
  }
  ${BATTLE_FRAGMENT}
`;

export const GET_BATTLE = gql`
  query GetBattle($battleId: ID!) {
    getBattle(battleId: $battleId) {
      ...BattleFields
    }
  }
  ${BATTLE_FRAGMENT}
`;

export const CREATE_BATTLE = gql`
  mutation CreateBattle($input: CreateBattleInput!) {
    createBattle(input: $input) {
      ...BattleFields
    }
  }
  ${BATTLE_FRAGMENT}
`;

export const JOIN_BATTLE = gql`
  mutation JoinBattle($battleId: ID!) {
    joinBattle(battleId: $battleId) {
      ...BattleFields
    }
  }
  ${BATTLE_FRAGMENT}
`;

export const REQUEST_UPLOAD_URL = gql`
  mutation RequestUploadUrl($battleId: ID!) {
    requestUploadUrl(battleId: $battleId) {
      url
      s3Key
    }
  }
`;

export const SUBMIT_SCORE = gql`
  mutation SubmitScore($battleId: ID!, $s3Key: String!) {
    submitScore(battleId: $battleId, s3Key: $s3Key) {
      battle {
        ...BattleFields
      }
      submittedScore
      songName
    }
  }
  ${BATTLE_FRAGMENT}
`;

export const SEND_STAMP = gql`
  mutation SendStamp($battleId: ID!, $type: StampType!) {
    sendStamp(battleId: $battleId, type: $type) {
      battleId
      userId
      type
      sentAt
    }
  }
`;

export const ON_BATTLE_UPDATED = gql`
  subscription OnBattleUpdated($battleId: ID!) {
    onBattleUpdated(battleId: $battleId) {
      ...BattleFields
    }
  }
  ${BATTLE_FRAGMENT}
`;

export const ON_STAMP_SENT = gql`
  subscription OnStampSent($battleId: ID!) {
    onStampSent(battleId: $battleId) {
      battleId
      userId
      type
      sentAt
    }
  }
`;

export const LIST_RANKING = gql`
  query ListRanking($by: RankingType!, $limit: Int) {
    listRanking(by: $by, limit: $limit) {
      rank
      user {
        ...UserFields
      }
    }
  }
  ${USER_FRAGMENT}
`;
