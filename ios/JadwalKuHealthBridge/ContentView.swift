import SwiftUI

struct ContentView: View {
    @AppStorage("backendURL") private var backendURL = "http://192.168.1.10:5001"
    @StateObject private var health = HealthKitManager()
    @State private var email = ""
    @State private var password = ""
    @State private var token = ""
    @State private var isSyncing = false
    @State private var message = "Masukkan akun JadwalKu, lalu izinkan Apple Health."

    var body: some View {
        NavigationStack {
            Form {
                Section("Server JadwalKu") {
                    TextField("Alamat backend", text: $backendURL)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.URL)
                    Text("Gunakan alamat IP Mac pada jaringan Wi-Fi yang sama, bukan localhost.")
                        .font(.footnote)
                }
                Section("Akun JadwalKu") {
                    TextField("Email", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                    SecureField("Password", text: $password)
                }
                Section("Apple Health") {
                    Button("Izinkan akses Apple Health") { Task { await requestAccess() } }
                    Button { Task { await sync() } } label: {
                        HStack { Text("Sinkronkan 7 hari terakhir"); Spacer(); if isSyncing { ProgressView() } }
                    }
                    .disabled(isSyncing)
                    Text(message).font(.footnote)
                }
            }
            .navigationTitle("JadwalKu Health")
        }
    }

    private func requestAccess() async {
        do {
            try await health.requestReadAccess()
            message = "Izin dibuka. Anda dapat mulai sinkronisasi."
        } catch { message = error.localizedDescription }
    }

    private func sync() async {
        isSyncing = true
        defer { isSyncing = false }
        do {
            let client = APIClient(baseURL: backendURL)
            if token.isEmpty { token = try await client.login(email: email, password: password) }
            try await health.requestReadAccess()
            let summaries = try await health.latestSevenDays()
            try await client.sync(summaries: summaries, token: token)
            message = "Berhasil disinkronkan. Buka Health Tracker di JadwalKu."
        } catch { message = error.localizedDescription }
    }
}
