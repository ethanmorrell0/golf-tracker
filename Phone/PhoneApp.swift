import SwiftUI
import WatchConnectivity

// Install test: shows whether the watch app is installed and receives its test message.

@main
struct GolfTrackerApp: App {
    var body: some Scene {
        WindowGroup { PhoneTestView() }
    }
}

final class PhoneTester: NSObject, ObservableObject, WCSessionDelegate {
    @Published var status = "Checking…"
    @Published var received = "Nothing yet"

    override init() {
        super.init()
        guard WCSession.isSupported() else { status = "This phone doesn't support Apple Watch"; return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    private func refresh(_ session: WCSession) {
        let text: String
        if !session.isPaired { text = "No watch paired" }
        else if !session.isWatchAppInstalled { text = "Watch paired, but the watch app is NOT installed ✗" }
        else { text = "Watch app installed ✓" }
        DispatchQueue.main.async { self.status = text }
    }

    func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {
        refresh(session)
    }

    func sessionWatchStateDidChange(_ session: WCSession) { refresh(session) }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        let hello = userInfo["hello"] as? String ?? "?"
        let gps = userInfo["gps"] as? String ?? "?"
        DispatchQueue.main.async { self.received = "\(hello)\nGPS: \(gps)" }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) { session.activate() }
}

struct PhoneTestView: View {
    @StateObject private var tester = PhoneTester()

    var body: some View {
        VStack(spacing: 24) {
            Text("⛳️ Golf Tracker").font(.largeTitle.bold())
            Text("Install test").foregroundStyle(.secondary)
            GroupBox("Watch") { Text(tester.status).frame(maxWidth: .infinity) }
            GroupBox("Message from watch") {
                Text(tester.received).multilineTextAlignment(.center).frame(maxWidth: .infinity)
            }
        }
        .padding()
    }
}
