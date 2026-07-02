import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  getCoachMessages,
  getKpiWeeks,
  getMyPlacement,
  sendCoachChat,
  type CoachChatMessage,
  type Placement,
} from "../api/client";

type CoachState = {
  placement: Placement | null;
  messages: CoachChatMessage[];
  loading: boolean;
  noPlacement: boolean;
  error: string | null;
  sending: boolean;
};

// Latest weekly auto-message, used as the opening assistant bubble when there's
// no chat history yet (brief). It is display-only and not persisted.
async function seedFromAutoMessage(
  placementId: string,
): Promise<CoachChatMessage[]> {
  try {
    const weeks = await getKpiWeeks(placementId);
    const latest = weeks
      .filter((w) => w.ai_coach_message)
      .sort((a, b) => b.week_number - a.week_number)[0];
    if (!latest?.ai_coach_message) return [];
    return [
      {
        id: "auto-seed",
        placement_id: placementId,
        role: "assistant",
        content: latest.ai_coach_message,
        created_at: latest.ai_coach_generated_at,
      },
    ];
  } catch {
    return [];
  }
}

export function useCoach() {
  const [state, setState] = useState<CoachState>({
    placement: null,
    messages: [],
    loading: true,
    noPlacement: false,
    error: null,
    sending: false,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const placement = await getMyPlacement();
        let messages = await getCoachMessages(placement.id);
        if (messages.length === 0) {
          messages = await seedFromAutoMessage(placement.id);
        }
        if (!active) return;
        setState((s) => ({
          ...s,
          placement,
          messages,
          loading: false,
          noPlacement: false,
        }));
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) {
          setState((s) => ({ ...s, loading: false, noPlacement: true }));
          return;
        }
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load coach.",
        }));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const send = useCallback(
    async (text: string) => {
      const placement = state.placement;
      const trimmed = text.trim();
      if (!placement || !trimmed || state.sending) return;

      // Optimistically append the learner's message.
      const optimistic: CoachChatMessage = {
        id: `temp-${Date.now()}`,
        placement_id: placement.id,
        role: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        messages: [...s.messages, optimistic],
        sending: true,
        error: null,
      }));

      try {
        const res = await sendCoachChat(placement.id, trimmed);
        setState((s) => ({
          ...s,
          // Replace the optimistic bubble with the persisted pair.
          messages: [
            ...s.messages.filter((m) => m.id !== optimistic.id),
            res.user_message,
            res.assistant_message,
          ],
          sending: false,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          messages: s.messages.filter((m) => m.id !== optimistic.id),
          sending: false,
          error:
            err instanceof Error
              ? err.message
              : "The coach is unavailable — please try again.",
        }));
      }
    },
    [state.placement, state.sending],
  );

  return { ...state, send };
}
