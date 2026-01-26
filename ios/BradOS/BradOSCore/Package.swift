// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "BradOSCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "BradOSCore", targets: ["BradOSCore"])
    ],
    targets: [
        .target(
            name: "BradOSCore",
            path: "Sources/BradOSCore"
        ),
        .testTarget(
            name: "BradOSCoreTests",
            dependencies: ["BradOSCore"],
            path: "Tests/BradOSCoreTests"
        )
    ]
)
