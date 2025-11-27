export interface CallOptions {
  type: "audio" | "video"
  recipientId: string
  recipientName: string
  tripId?: string
}

export class CallingService {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null

  async initiateCall(options: CallOptions): Promise<void> {
    try {
      // Request microphone permission
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: options.type === "video",
      })

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
      })

      // Add local stream to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!)
      })

      console.log("[v0] Call initiated with", options.recipientName)
    } catch (error) {
      console.error("[v0] Failed to initiate call:", error)
      throw new Error("Failed to access media devices")
    }
  }

  async makePhoneCall(phoneNumber: string): Promise<void> {
    // Standard phone call using tel: protocol
    window.location.href = `tel:${phoneNumber}`
  }

  endCall(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
    }
    if (this.peerConnection) {
      this.peerConnection.close()
    }
    this.localStream = null
    this.peerConnection = null
    this.remoteStream = null
  }
}

export const callingService = new CallingService()
