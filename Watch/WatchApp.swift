import CoreLocation
import SwiftUI
import WatchConnectivity

// Install test: proves a sideloaded watch app can open, read GPS and talk to the phone.

@main
struct GolfTrackerWatchApp: App {
    var body: some Scene {
        WindowGroup { WatchTestView() }
    }
}

final class WatchTester: NSObject, ObservableObject, CLLocationManagerDelegate, WCSessionDelegate {
    @Published var gps = "Not checked"
    @Published var phone = "Not sent"
    private let location = CLLocationManager()

    override init() {
        super.init()
        location.delegate = self
        location.desiredAccuracy = kCLLocationAccuracyBest
        if WCSession.isSupported() {
            WCSession.default.delegate = self
            WCSession.default.activate()
        }
    }

    func checkGPS() {
        gps = "Searching…"
        location.requestWhenInUseAuthorization()
        location.requestLocation()
    }

    func sendToPhone() {
        let session = WCSession.default
        guard session.activationState == .activated else { phone = "Not connected"; return }
        let message = ["hello": "From your watch at \(Date().formatted(date: .omitted, time: .standard))", "gps": gps]
        // transferUserInfo queues delivery even if the phone app is closed.
        session.transferUserInfo(message)
        phone = "Sent ✓"
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let fix = locations.last else { return }
        gps = String(format: "%.5f, %.5f\n±%.0f m", fix.coordinate.latitude, fix.coordinate.longitude, fix.horizontalAccuracy)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        gps = "Failed: \(error.localizedDescription)"
    }

    func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {}
}

struct WatchTestView: View {
    @StateObject private var tester = WatchTester()

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                Text("⛳️ Hello!").font(.title2)
                Text("Install worked").font(.footnote).foregroundStyle(.secondary)
                Button("Test GPS", action: tester.checkGPS)
                Text(tester.gps).font(.caption2).multilineTextAlignment(.center)
                Button("Send to phone", action: tester.sendToPhone)
                Text(tester.phone).font(.caption2)
            }
        }
    }
}
