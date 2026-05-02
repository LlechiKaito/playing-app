import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { S3Client } from "@aws-sdk/client-s3";

import { UserDynamoRepository } from "@/infrastructure/repositories/user.dynamodb.repository.js";
import { BattleDynamoRepository } from "@/infrastructure/repositories/battle.dynamodb.repository.js";
import { ImageHashDynamoRepository } from "@/infrastructure/repositories/image-hash.dynamodb.repository.js";
import { InMemoryStampRateLimitRepository } from "@/infrastructure/repositories/stamp-rate-limit.repository.js";
import { createOcrService } from "@/infrastructure/ocr/textract.service.js";

import { makeSignupUseCase } from "@/application/usecases/auth/signup.usecase.js";
import { makeLoginUseCase } from "@/application/usecases/auth/login.usecase.js";
import { makeCreateBattleUseCase } from "@/application/usecases/battle/create-battle.usecase.js";
import { makeListOpenBattlesUseCase } from "@/application/usecases/battle/list-open-battles.usecase.js";
import { makeGetBattleUseCase } from "@/application/usecases/battle/get-battle.usecase.js";
import { makeJoinBattleUseCase } from "@/application/usecases/battle/join-battle.usecase.js";
import { makeRequestUploadUrlUseCase } from "@/application/usecases/battle/request-upload-url.usecase.js";
import { makeSubmitScoreUseCase } from "@/application/usecases/battle/submit-score.usecase.js";
import { makeSendStampUseCase } from "@/application/usecases/battle/send-stamp.usecase.js";
import { makeListRankingUseCase } from "@/application/usecases/ranking/list-ranking.usecase.js";

export type Container = ReturnType<typeof buildContainer>;

export function buildContainer(deps: { doc: DynamoDBDocumentClient; s3: S3Client }) {
  const userRepo = new UserDynamoRepository(deps.doc);
  const battleRepo = new BattleDynamoRepository(deps.doc);
  const imageHashRepo = new ImageHashDynamoRepository(deps.doc);
  const rateLimitRepo = new InMemoryStampRateLimitRepository();
  const ocr = createOcrService();

  return {
    userRepo,
    battleRepo,
    signup: makeSignupUseCase({ userRepo }),
    login: makeLoginUseCase({ userRepo }),
    createBattle: makeCreateBattleUseCase({ battleRepo }),
    listOpenBattles: makeListOpenBattlesUseCase({ battleRepo }),
    getBattle: makeGetBattleUseCase({ battleRepo }),
    joinBattle: makeJoinBattleUseCase({ battleRepo }),
    requestUploadUrl: makeRequestUploadUrlUseCase({ battleRepo }),
    submitScore: makeSubmitScoreUseCase({
      battleRepo,
      userRepo,
      imageHashRepo,
      ocr,
      s3: deps.s3,
    }),
    sendStamp: makeSendStampUseCase({ battleRepo, rateLimitRepo }),
    listRanking: makeListRankingUseCase({ userRepo }),
  };
}
