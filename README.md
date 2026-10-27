# Golf Tracker

A free personal golf GPS and shot tracker for Apple Watch and iPhone.

**Current stage: install test.** This build has one job: proving that a sideloaded app can run on the watch, read GPS and send data to the phone. The full tracker gets built only after this passes.

## How it gets built

Every push to `main` makes GitHub build the app on a free Mac in the cloud. The finished `GolfTracker.ipa` appears under **Releases** on this repository's page.

## One-time setup (on a borrowed Windows PC, about 30 minutes)

1. On the PC, install **iTunes** from apple.com, not the Microsoft Store.
2. Install **iloader** from its official page: <https://github.com/nab138/iloader>
3. Plug in your iPhone, unlock it, and tap **Trust**.
4. Open iloader, sign in with your Apple ID, pick your iPhone and choose **Install SideStore**.
5. On the iPhone, go to **Settings → General → VPN & Device Management**, tap your Apple ID under *Developer App* and trust it. If asked, also turn on **Settings → Privacy & Security → Developer Mode** and restart.
6. Open SideStore once and finish its setup. If something goes wrong, see <https://docs.sidestore.io>.

You won't need the PC again.

## Installing Golf Tracker (on your iPhone)

1. In Safari, open this repository's **Releases** page and download `GolfTracker.ipa`.
2. Open **SideStore → My Apps → +** and pick the downloaded file.
3. Open the **Watch** app on your iPhone, scroll to **Golf Tracker** and tap **Install**.

## The test: tell Claude what happens

| Check | Pass |
|---|---|
| Golf Tracker icon appears on the watch | ☐ |
| Watch app opens and says "Hello" | ☐ |
| **Test GPS** shows coordinates (try outdoors) | ☐ |
| Phone app says "Watch app installed ✓" | ☐ |
| **Send to phone** → message appears on the phone | ☐ |

SideStore refreshes the app every 7 days in the background. Open SideStore now and then to keep this working.
