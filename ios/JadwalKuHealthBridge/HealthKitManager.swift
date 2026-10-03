import Foundation
import Combine
import HealthKit

struct HealthDayPayload: Codable, Identifiable {
    let id = UUID()
    let date: String
    let steps: Int
    let activeEnergyKcal: Double
    let exerciseMinutes: Int
    let standHours: Int
    let distanceMeters: Double

    enum CodingKeys: String, CodingKey {
        case date, steps, activeEnergyKcal, exerciseMinutes, standHours, distanceMeters
    }
}

@MainActor
final class HealthKitManager: ObservableObject {
    private let store = HKHealthStore()

    private let readTypes: Set<HKObjectType> = [
        HKQuantityType(.stepCount),
        HKQuantityType(.activeEnergyBurned),
        HKQuantityType(.appleExerciseTime),
        HKQuantityType(.appleStandTime),
        HKQuantityType(.distanceWalkingRunning)
    ]

    func requestReadAccess() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw HealthError.notAvailable
        }
        try await store.requestAuthorization(toShare: [], read: readTypes)
    }

    func latestSevenDays() async throws -> [HealthDayPayload] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]

        return try await (0..<7).reversed().asyncMap { offset in
            let start = calendar.date(byAdding: .day, value: -offset, to: today)!
            let end = calendar.date(byAdding: .day, value: 1, to: start)!
            async let steps = quantity(.stepCount, unit: .count(), start: start, end: end)
            async let energy = quantity(.activeEnergyBurned, unit: .kilocalorie(), start: start, end: end)
            async let exercise = quantity(.appleExerciseTime, unit: .minute(), start: start, end: end)
            async let stand = quantity(.appleStandTime, unit: .hour(), start: start, end: end)
            async let distance = quantity(.distanceWalkingRunning, unit: .meter(), start: start, end: end)

            return try await HealthDayPayload(
                date: formatter.string(from: start),
                steps: Int(steps.rounded()),
                activeEnergyKcal: energy,
                exerciseMinutes: Int(exercise.rounded()),
                standHours: Int(stand.rounded()),
                distanceMeters: distance
            )
        }
    }

    private func quantity(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit, start: Date, end: Date) async throws -> Double {
        guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else { return 0 }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                continuation.resume(returning: result?.sumQuantity()?.doubleValue(for: unit) ?? 0)
            }
            store.execute(query)
        }
    }
}

enum HealthError: LocalizedError {
    case notAvailable

    var errorDescription: String? {
        switch self {
        case .notAvailable: return "Apple Health tidak tersedia pada perangkat ini."
        }
    }
}

extension Sequence {
    func asyncMap<T>(_ transform: (Element) async throws -> T) async throws -> [T] {
        var values: [T] = []
        for item in self { values.append(try await transform(item)) }
        return values
    }
}
