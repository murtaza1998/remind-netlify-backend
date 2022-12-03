import { env } from "process";

class PaddlePlanClass {
  getPlanName(planId: string): "Monthly" | "Yearly" {
    if (!env.PADDLE_PLAN_MONTHLY_ID || !env.PADDLE_PLAN_YEARLY_ID) {
      throw new Error("Paddle plan IDs not set");
    }

    if (planId === env.PADDLE_PLAN_MONTHLY_ID) {
      return "Monthly";
    } else if (planId === env.PADDLE_PLAN_YEARLY_ID) {
      return "Yearly";
    } else {
      throw new Error(`Unknown plan ID ${planId}`);
    }
  }
}

export const PaddlePlan = new PaddlePlanClass();
