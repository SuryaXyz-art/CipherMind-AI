/**
 * Tests the Hermes agentic research control loop with an injected completer,
 * so tool-calling / multi-step reasoning is verified without any network.
 */

import { expect } from "chai";
import { runResearchAgent, defaultTools, type Completer } from "../backend/researchAgent";
import type { ChatMessage } from "../backend/nousClient";

describe("Hermes agentic research loop", function () {
  it("calls a tool, feeds the result back, then produces a final answer", async function () {
    let turn = 0;
    const fakeComplete: Completer = async (messages): Promise<ChatMessage> => {
      turn++;
      if (turn === 1) {
        // First turn: model decides to call get_crypto_price.
        return {
          role: "assistant",
          content: null,
          tool_calls: [
            { id: "c1", type: "function", function: { name: "get_crypto_price", arguments: '{"symbol":"BTC"}' } },
          ],
        };
      }
      // Second turn: the tool result must have been appended before this call.
      const toolMsg = messages.find((m) => m.role === "tool");
      expect(toolMsg, "tool result fed back into context").to.exist;
      expect(String(toolMsg!.content)).to.contain("BTC");
      return { role: "assistant", content: `Final: ${toolMsg!.content}` };
    };

    const res = await runResearchAgent("What's the price of BTC?", { complete: fakeComplete });

    expect(res.trace).to.have.length(1);
    expect(res.trace[0].tool).to.equal("get_crypto_price");
    expect(res.trace[0].result).to.contain("67,000");
    expect(res.answer).to.contain("Final:");
    expect(res.answer).to.contain("BTC");
  });

  it("returns directly when the model needs no tools", async function () {
    const fakeComplete: Completer = async () => ({ role: "assistant", content: "Direct answer." });
    const res = await runResearchAgent("Say hi", { complete: fakeComplete });
    expect(res.trace).to.have.length(0);
    expect(res.answer).to.equal("Direct answer.");
    expect(res.steps).to.equal(1);
  });

  it("stops at maxSteps if the model keeps calling tools", async function () {
    const loopComplete: Completer = async () => ({
      role: "assistant",
      content: null,
      tool_calls: [{ id: "x", type: "function", function: { name: "explain_concept", arguments: '{"topic":"fhe"}' } }],
    });
    const finalComplete: Completer = async (messages, tools) => {
      // After maxSteps the loop asks for a final answer with no tools.
      if (tools.length === 0) return { role: "assistant", content: "Forced final." };
      return loopComplete(messages, tools);
    };
    const res = await runResearchAgent("loop", { complete: finalComplete, maxSteps: 3, tools: defaultTools() });
    expect(res.steps).to.equal(3);
    expect(res.trace.length).to.equal(3);
    expect(res.answer).to.equal("Forced final.");
  });
});
