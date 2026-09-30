import Foundation

struct LoginResponse: Decodable {
    let token: String
}

struct HealthSyncRequest: Encodable {
    let dailySummaries: [HealthDayPayload]
}

enum APIClientError: LocalizedError {
    case invalidURL, invalidCredentials, requestFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Alamat backend tidak valid."
        case .invalidCredentials: return "Email atau password JadwalKu tidak valid."
        case .requestFailed(let message): return message
        }
    }
}

struct APIClient {
    var baseURL: String

    private var rootURL: URL? { URL(string: baseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))) }

    func login(email: String, password: String) async throws -> String {
        guard let url = rootURL?.appendingPathComponent("api/auth/login") else { throw APIClientError.invalidURL }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["email": email, "password": password])
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { throw APIClientError.invalidCredentials }
        return try JSONDecoder().decode(LoginResponse.self, from: data).token
    }

    func sync(summaries: [HealthDayPayload], token: String) async throws {
        guard let url = rootURL?.appendingPathComponent("api/health/sync") else { throw APIClientError.invalidURL }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(HealthSyncRequest(dailySummaries: summaries))
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            let message = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["error"] as? String ?? "Sinkronisasi gagal."
            throw APIClientError.requestFailed(message)
        }
    }
}
