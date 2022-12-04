import { ENV_VARIABLES } from "../configs/envVariables";

class PaddlePlanClass {
  getPlanName(planId: string): "Monthly" | "Yearly" {
    const { PADDLE_PLAN_MONTHLY_ID, PADDLE_PLAN_YEARLY_ID } = ENV_VARIABLES;
    if (!PADDLE_PLAN_MONTHLY_ID || !PADDLE_PLAN_YEARLY_ID) {
      throw new Error("Paddle plan IDs not set");
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
