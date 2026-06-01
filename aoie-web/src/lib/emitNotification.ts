interface EmitNotificationParams {
  recipientId: string;

  notification: {
    type: string;
    senderId: string;

    artworkId?: string;
    commentId?: string;
  };
}

export async function emitNotification({
  recipientId,
  notification,
}: EmitNotificationParams) {
  try {
    await fetch(
      `${process.env.SOCKET_SERVER_URL}/emit`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          channelId: `user:${recipientId}`,

          event:
            "notification:new",

          data: notification,
        }),
      }
    );
  } catch (error) {
    console.error(
      "Emit Notification Error:",
      error
    );
  }
}