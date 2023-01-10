import { env } from "process";

class PaddlePlanClass {
  getPlanName(planId: string): "Monthly" | "Yearly" {
    const { PADDLE_PLAN_MONTHLY_ID, PADDLE_PLAN_YEARLY_ID } = env;
    if (!PADDLE_PLAN_MONTHLY_ID) {
      throw new Error("Paddle monthly plan ID not set");
    }
    if (!PADDLE_PLAN_YEARLY_ID) {
      throw new Error("Paddle yearly plan ID not set");
    }

    if (planId === PADDLE_PLAN_MONTHLY_ID) {
      return "Monthly";
    } else if (planId === PADDLE_PLAN_YEARLY_ID) {
      return "Yearly";
    } else {
      throw new Error(`Unknown plan ID ${planId}`);
    }
  }
}

export const PaddlePlan = new PaddlePlanClass();
