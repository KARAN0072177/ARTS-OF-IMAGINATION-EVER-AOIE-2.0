interface EmitAdminEventParams {
  event: string;
  data: any;
}

export async function emitAdminEvent({ event, data }: EmitAdminEventParams) {
  try {
    const socketUrl = process.env.SOCKET_SERVER_URL || "http://localhost:4000";
    await fetch(`${socketUrl}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelId: "admin_global",
        event,
        data,
      }),
    });
  } catch (error) {
    console.error("Emit Admin Event Error:", error);
  }
}
