# -*- coding: utf-8 -*-
"""Generator sequence diagram (PlantUML) untuk 10 use case.

Style mengikuti contoh Sequence Diagram Pemberian Disposisi (Garamond).
Jalankan: python generate_sequence_diagrams.py
"""

from pathlib import Path


SKIN = """\
skinparam defaultFontName "Garamond"
skinparam defaultFontSize 12
skinparam TitleFontSize 14
skinparam SequenceMessageFontSize 11
skinparam SequenceParticipantFontSize 12
skinparam ActorFontSize 12
"""


def wrap(title: str, body: str) -> str:
    return f"""@startuml
title Sequence Diagram {title}

{SKIN}
{body.strip()}
@enduml
"""


DIAGRAMS = {
    "01-login.puml": wrap(
        "Login",
        r"""
actor "Pengguna\n(Admin / Guru / Siswa)" as User
boundary "View\n(Auth/Login)" as View
control "Controller\n(AuthenticatedSessionController)" as Controller
control "Request\n(LoginRequest)" as FormRequest
entity "Model\n(User)" as Model
database "Database" as DB

User -> View : Membuka halaman login
activate View
View -> Controller : GET /login
activate Controller
Controller -> View : Render Auth/Login
View -> User : Menampilkan form login
deactivate Controller

User -> View : Mengisi email & kata sandi, lalu masuk
View -> Controller : POST /login
activate Controller
Controller -> FormRequest : Validasi input
activate FormRequest
FormRequest --> Controller : Data tervalidasi
deactivate FormRequest

Controller -> Model : Auth::attempt(credentials)
activate Model
Model -> DB : SELECT users WHERE email
activate DB
DB --> Model : Data user
deactivate DB

alt Kredensial valid
    Model --> Controller : Autentikasi berhasil
    deactivate Model
    Controller -> Controller : Regenerasi session
    Controller -> View : Redirect ke /dashboard (sesuai peran)
    View -> User : Menampilkan beranda sesuai peran
else Kredensial tidak valid
    Model --> Controller : Autentikasi gagal
    deactivate Model
    Controller -> View : Redirect + pesan error
    View -> User : Menampilkan pesan gagal masuk
end

deactivate Controller
deactivate View
""",
    ),
    "02-logout.puml": wrap(
        "Logout",
        r"""
actor "Pengguna\n(Admin / Guru / Siswa)" as User
boundary "View\n(Layout / Navigasi)" as View
control "Controller\n(AuthenticatedSessionController)" as Controller
database "Database" as DB

User -> View : Menekan menu keluar
activate View
View -> Controller : POST /logout
activate Controller
Controller -> Controller : Auth::logout()
Controller -> Controller : Invalidate & regenerate session
Controller -> DB : Hapus sesi aktif (opsional)
activate DB
DB --> Controller : OK
deactivate DB
Controller -> View : Redirect ke /login
View -> User : Menampilkan halaman login
deactivate Controller
deactivate View
""",
    ),
    "03-master-data.puml": wrap(
        "Mengelola Master Data",
        r"""
actor "Admin" as User
boundary "View\n(Admin Alat / Bahan /\nPengguna / Jadwal / Jaminan)" as View
control "Controller\n(EquipmentController /\nSupplyController /\nUserController /\nPracticumScheduleController /\nLoanCollateralController)" as Controller
control "Request\n(Store* / Update* Request)" as FormRequest
control "Service\n(EquipmentImageService /\nUserImportService)" as Service
entity "Model\n(Equipment / Supply /\nUser / PracticumSchedule /\nLoanCollateral)" as Model
database "Database" as DB

User -> View : Membuka menu master data
activate View
View -> Controller : GET index (alat/bahan/pengguna/jadwal/jaminan)
activate Controller
Controller -> Model : Query daftar data
activate Model
Model -> DB : SELECT
activate DB
DB --> Model : Rows
deactivate DB
deactivate Model
Controller -> View : Render halaman Index
View -> User : Menampilkan daftar data
deactivate Controller

User -> View : Menambah / mengubah / menghapus data
View -> Controller : POST / PUT / DELETE
activate Controller
Controller -> FormRequest : Validasi input
activate FormRequest

alt Data valid
    FormRequest --> Controller : Data tervalidasi
    deactivate FormRequest
    opt Upload gambar / import user
        Controller -> Service : Proses file pendukung
        activate Service
        Service --> Controller : Path / hasil import
        deactivate Service
    end
    Controller -> Model : create() / update() / delete()
    activate Model
    Model -> DB : INSERT / UPDATE / DELETE
    activate DB
    DB --> Model : OK
    deactivate DB
    deactivate Model
    Controller -> View : Redirect + pesan sukses
    View -> User : Menampilkan data terbaru
else Data tidak valid
    FormRequest --> Controller : ValidationException
    deactivate FormRequest
    Controller -> View : Pesan error validasi
    View -> User : Menampilkan pesan kesalahan
end

deactivate Controller
deactivate View
""",
    ),
    "04-verifikasi.puml": wrap(
        "Verifikasi Peminjaman & Permintaan Bahan",
        r"""
actor "Admin" as User
boundary "View\n(Admin/Loan)" as View
control "Controller\n(Admin/LoanController)" as Controller
control "Request\n(RejectLoanRequest /\nSetQueuePriorityRequest)" as FormRequest
control "Service\n(LoanWorkflowService /\nLoanQueueService)" as Service
entity "Model\n(Loan / Submission /\nLoanStatusLog)" as Model
database "Database" as DB

User -> View : Membuka menu Peminjaman
activate View
View -> Controller : GET admin/loans
activate Controller
Controller -> Model : Query pengajuan menunggu / antrian
activate Model
Model -> DB : SELECT loans, submissions
activate DB
DB --> Model : Daftar pengajuan
deactivate DB
deactivate Model
Controller -> View : Render Admin/Loan/Index
View -> User : Menampilkan daftar peminjaman & permintaan
deactivate Controller

User -> View : Memeriksa detail & memilih aksi
View -> Controller : POST approve / reject / queue-priority
activate Controller

alt Menyetujui pengajuan
    Controller -> Service : approve(loan, admin)
    activate Service
    Service -> Model : Cek stok & update status disetujui
    activate Model
    Model -> DB : UPDATE loans + INSERT status_logs
    activate DB
    DB --> Model : OK
    deactivate DB
    deactivate Model
    Service --> Controller : Berhasil
    deactivate Service
    Controller -> View : Redirect + notifikasi sukses
    View -> User : Status menjadi Disetujui
else Menolak pengajuan
    Controller -> FormRequest : Validasi alasan penolakan
    activate FormRequest
    FormRequest --> Controller : Alasan valid
    deactivate FormRequest
    Controller -> Service : reject(loan, reason, admin)
    activate Service
    Service -> Model : Update status ditolak
    activate Model
    Model -> DB : UPDATE loans
    activate DB
    DB --> Model : OK
    deactivate DB
    deactivate Model
    Service --> Controller : Berhasil
    deactivate Service
    Controller -> View : Redirect + pesan ditolak
    View -> User : Status menjadi Ditolak
else Mengatur prioritas antrian
    Controller -> FormRequest : Validasi prioritas
    activate FormRequest
    FormRequest --> Controller : Prioritas valid
    deactivate FormRequest
    Controller -> Service : setQueuePriority(...)
    activate Service
    Service -> Model : Update queue_priority
    activate Model
    Model -> DB : UPDATE loans
    activate DB
    DB --> Model : OK
    deactivate DB
    deactivate Model
    Service --> Controller : Berhasil
    deactivate Service
    Controller -> View : Redirect + pesan sukses
    View -> User : Prioritas antrian diperbarui
end

deactivate Controller
deactivate View
""",
    ),
    "05-pengembalian-alat.puml": wrap(
        "Pengembalian Alat",
        r"""
actor "Siswa" as Siswa
actor "Admin" as Admin
boundary "View\n(Siswa/Loan &\nAdmin/Collateral)" as View
control "Controller\n(Siswa/LoanController &\nAdmin/LoanCollateralController)" as Controller
control "Request\n(InspectReturnRequest /\nReturnLoanRequest)" as FormRequest
control "Service\n(CollateralWorkflowService /\nLoanWorkflowService)" as Service
entity "Model\n(Loan / LoanReturnInspection /\nLoanCollateral / Equipment)" as Model
database "Database" as DB

Siswa -> View : Mengajukan pengembalian alat
activate View
View -> Controller : POST siswa/loans/{id}/request-return
activate Controller
Controller -> Service : requestReturnInspection(loan, note, siswa)
activate Service
Service -> Model : Update status menunggu_inspeksi
activate Model
Model -> DB : UPDATE loans + INSERT status_logs
activate DB
DB --> Model : OK
deactivate DB
deactivate Model
Service --> Controller : Berhasil
deactivate Service
Controller -> View : Redirect + pesan sukses
View -> Siswa : Menunggu inspeksi admin
deactivate Controller

Admin -> View : Membuka pengajuan pengembalian
View -> Controller : POST admin/loans/{id}/inspect
activate Controller
Controller -> FormRequest : Validasi hasil inspeksi
activate FormRequest
FormRequest --> Controller : Data inspeksi valid
deactivate FormRequest
Controller -> Service : inspectReturn(loan, data, admin)
activate Service

alt Alat baik & lengkap
    Service -> Model : Simpan inspeksi + kembalikan stok
    activate Model
    Model -> DB : INSERT inspections / UPDATE equipment / UPDATE loans
    activate DB
    DB --> Model : OK
    deactivate DB
    deactivate Model
    opt Ada jaminan kartu
        Service -> Model : Kembalikan kartu jaminan
        activate Model
        Model -> DB : UPDATE loan_collaterals
        activate DB
        DB --> Model : OK
        deactivate DB
        deactivate Model
    end
    Service --> Controller : Status Dikembalikan
    deactivate Service
    Controller -> View : Redirect + pesan sukses
    View -> Admin : Pengembalian selesai
else Alat rusak / hilang
    Service -> Model : Simpan inspeksi + tandai kompensasi
    activate Model
    Model -> DB : INSERT inspections / compensations
    activate DB
    DB --> Model : OK
    deactivate DB
    deactivate Model
    Service --> Controller : Menunggu kompensasi
    deactivate Service
    Controller -> View : Redirect + peringatan kompensasi
    View -> Admin : Perlu kompensasi sebelum kartu dikembalikan
end

deactivate Controller
deactivate View
""",
    ),
    "06-membuat-laporan.puml": wrap(
        "Membuat Laporan",
        r"""
actor "Pengguna\n(Admin / Guru)" as User
boundary "View\n(Admin/Report /\nGuru/Report)" as View
control "Controller\n(Admin/ReportController /\nGuru/ReportController)" as Controller
control "Service\n(AdminReportDataService /\nGuruReportDataService)" as Service
entity "Model\n(Loan / Equipment /\nSubmission)" as Model
database "Database" as DB

User -> View : Membuka menu Laporan
activate View
View -> Controller : GET reports
activate Controller
Controller -> Service : forRequest(filters)
activate Service
Service -> Model : Query rekap peminjaman & inventaris
activate Model
Model -> DB : SELECT agregasi data
activate DB
DB --> Model : Rows laporan
deactivate DB
deactivate Model
Service --> Controller : Payload laporan
deactivate Service
Controller -> View : Render halaman Laporan
View -> User : Menampilkan ringkasan laporan
deactivate Controller

User -> View : Memilih jenis laporan & rentang tanggal
View -> Controller : GET reports?filter=...
activate Controller
Controller -> Service : forRequest(filters)
activate Service
Service -> Model : Query sesuai filter
activate Model
Model -> DB : SELECT
activate DB
DB --> Model : Data terfilter
deactivate DB
deactivate Model

alt Ada data
    Service --> Controller : Data laporan
    deactivate Service
    Controller -> View : Render + opsi unduh/cetak
    View -> User : Mengunduh / mencetak laporan
else Tidak ada data
    Service --> Controller : Dataset kosong
    deactivate Service
    Controller -> View : Render laporan kosong
    View -> User : Menampilkan laporan kosong
end

deactivate Controller
deactivate View
""",
    ),
    "07-monitoring.puml": wrap(
        "Monitoring Peminjaman & Permintaan Siswa",
        r"""
actor "Guru" as User
boundary "View\n(Guru/Loan)" as View
control "Controller\n(Guru/LoanController)" as Controller
control "Service\n(LoanListGrouper /\nSubmissionPresenter)" as Service
entity "Model\n(Loan / Submission /\nPracticumSchedule)" as Model
database "Database" as DB

User -> View : Membuka menu Peminjaman Siswa
activate View
View -> Controller : GET guru/loans
activate Controller
Controller -> Model : Query peminjaman & permintaan terkait guru
activate Model
Model -> DB : SELECT loans / submissions
activate DB
DB --> Model : Daftar data
deactivate DB
deactivate Model

alt Ada data
    Controller -> Service : Group / format daftar
    activate Service
    Service --> Controller : Daftar aktif / riwayat
    deactivate Service
    Controller -> View : Render Guru/Loan/Index
    View -> User : Menampilkan daftar peminjaman & permintaan

    User -> View : Membuka aktif / riwayat & pilih detail
    View -> Controller : GET guru/loans/{id} atau pengajuan/{submission}
    activate Controller
    Controller -> Model : Load detail + jadwal praktikum
    activate Model
    Model -> DB : SELECT detail
    activate DB
    DB --> Model : Detail lengkap
    deactivate DB
    deactivate Model
    Controller -> View : Render Show / Submission
    View -> User : Menampilkan detail & jadwal terkait
    deactivate Controller
else Belum ada data
    Controller -> View : Render daftar kosong
    View -> User : Menampilkan pesan data belum tersedia
end

deactivate Controller
deactivate View
""",
    ),
    "08-lihat-inventaris.puml": wrap(
        "Lihat Inventaris",
        r"""
actor "Pengguna\n(Guru / Siswa)" as User
boundary "View\n(Inventaris / Equipment /\nSupply)" as View
control "Controller\n(Guru/InventarisController /\nSiswa/EquipmentController /\nSiswa/SupplyController)" as Controller
entity "Model\n(Equipment / Supply)" as Model
database "Database" as DB

User -> View : Membuka menu Alat Lab / Bahan Lab
activate View
View -> Controller : GET inventaris / equipment / supplies
activate Controller
Controller -> Model : Query katalog alat / bahan
activate Model
Model -> DB : SELECT equipment
activate DB
DB --> Model : Daftar barang + stok
deactivate DB
deactivate Model
Controller -> View : Render katalog
View -> User : Menampilkan daftar inventaris
deactivate Controller

User -> View : Memilih salah satu barang
View -> Controller : GET show/{id}
activate Controller
Controller -> Model : find(id)
activate Model
Model -> DB : SELECT detail
activate DB
DB --> Model : Data barang

alt Barang ditemukan
    Model --> Controller : Detail barang
    deactivate Model
    deactivate DB
    Controller -> View : Render halaman detail
    View -> User : Menampilkan status, kondisi, atau stok
else Barang tidak ditemukan
    Model --> Controller : Not found
    deactivate Model
    deactivate DB
    Controller -> View : Pesan error
    View -> User : Data tidak tersedia
end

deactivate Controller
deactivate View
""",
    ),
    "09-mengajukan.puml": wrap(
        "Mengajukan Peminjaman & Permintaan Bahan",
        r"""
actor "Siswa" as User
boundary "View\n(Siswa/Loan/Create)" as View
control "Controller\n(Siswa/LoanController)" as Controller
control "Request\n(StoreStudentLoanRequest /\nStoreStudentPackageLoanRequest)" as FormRequest
control "Service\n(LoanQueueService /\nLoanWorkflowService)" as Service
entity "Model\n(Submission / Loan /\nLoanItem / Equipment)" as Model
database "Database" as DB

User -> View : Membuka menu Ajukan Alat / Bahan
activate View
View -> Controller : GET siswa/loans/create
activate Controller
Controller -> Model : Ambil katalog & opsi form
activate Model
Model -> DB : SELECT equipment / schedules
activate DB
DB --> Model : Data form
deactivate DB
deactivate Model
Controller -> View : Render form pengajuan
View -> User : Menampilkan form peminjaman / permintaan
deactivate Controller

User -> View : Memilih jenis, barang, jumlah & data pendukung
View -> Controller : POST siswa/loans atau siswa/loans/package
activate Controller
Controller -> FormRequest : Validasi input
activate FormRequest

alt Data lengkap & valid
    FormRequest --> Controller : Data tervalidasi
    deactivate FormRequest
    Controller -> Service : validateItemsForSubmit() + resolveInitialStatus()
    activate Service
    Service -> Model : Cek ketersediaan stok
    activate Model
    Model -> DB : SELECT available
    activate DB
    DB --> Model : Stok terkini
    deactivate DB
    deactivate Model

    alt Stok mencukupi
        Service --> Controller : Status awal: diminta
    else Stok tidak mencukupi
        Service --> Controller : Status awal: antrian
    end
    deactivate Service

    Controller -> Model : Submission::create + Loan::create + items
    activate Model
    Model -> DB : INSERT submissions, loans, loan_items
    activate DB
    DB --> Model : OK
    deactivate DB
    deactivate Model
    Controller -> View : Redirect ke daftar aktif + pesan sukses
    View -> User : Menampilkan status Menunggu / Antrian
else Data belum lengkap
    FormRequest --> Controller : ValidationException
    deactivate FormRequest
    Controller -> View : Pesan error validasi
    View -> User : Melengkapi isian yang kurang
end

deactivate Controller
deactivate View
""",
    ),
    "10-kelola-saya.puml": wrap(
        "Kelola Peminjaman & Permintaan Saya",
        r"""
actor "Siswa" as User
boundary "View\n(Siswa/Loan)" as View
control "Controller\n(Siswa/LoanController)" as Controller
control "Request\n(UpdateStudentLoanRequest)" as FormRequest
control "Service\n(LoanWorkflowService /\nCollateralWorkflowService)" as Service
entity "Model\n(Loan / Submission /\nLoanStatusLog)" as Model
database "Database" as DB

User -> View : Membuka menu Alat & Bahan Saya
activate View
View -> Controller : GET siswa/loans?scope=active|history
activate Controller
Controller -> Model : Query pengajuan milik siswa
activate Model
Model -> DB : SELECT loans / submissions
activate DB
DB --> Model : Daftar aktif / riwayat
deactivate DB
deactivate Model
Controller -> View : Render Siswa/Loan/Index
View -> User : Menampilkan daftar pengajuan
deactivate Controller

User -> View : Memilih salah satu data
View -> Controller : GET siswa/loans/{id}
activate Controller
Controller -> Model : Load detail pengajuan
activate Model
Model -> DB : SELECT detail
activate DB
DB --> Model : Detail
deactivate DB
deactivate Model
Controller -> View : Render detail
View -> User : Menampilkan detail pengajuan
deactivate Controller

alt Status Menunggu
    User -> View : Mengubah / membatalkan pengajuan
    View -> Controller : PUT update / POST cancel
    activate Controller
    opt Ubah data
        Controller -> FormRequest : Validasi perubahan
        activate FormRequest
        FormRequest --> Controller : Data valid
        deactivate FormRequest
    end
    Controller -> Service : update / cancel(loan, siswa)
    activate Service
    Service -> Model : Simpan perubahan status
    activate Model
    Model -> DB : UPDATE loans (+ status_logs)
    activate DB
    DB --> Model : OK
    deactivate DB
    deactivate Model
    Service --> Controller : Berhasil
    deactivate Service
    Controller -> View : Redirect + pesan sukses
    View -> User : Status diperbarui
    deactivate Controller
else Status Dipinjam (alat)
    User -> View : Mengajukan pengembalian alat
    View -> Controller : POST request-return
    activate Controller
    Controller -> Service : requestReturnInspection(...)
    activate Service
    Service -> Model : Update menunggu_inspeksi
    activate Model
    Model -> DB : UPDATE loans
    activate DB
    DB --> Model : OK
    deactivate DB
    deactivate Model
    Service --> Controller : Berhasil
    deactivate Service
    Controller -> View : Redirect + pesan sukses
    View -> User : Menunggu inspeksi admin
    deactivate Controller
else Riwayat / lainnya
    View -> User : Selesai melihat detail (tanpa aksi)
end

deactivate View
""",
    ),
}


def main():
    out_dir = Path(__file__).resolve().parent / "sequence-diagrams"
    out_dir.mkdir(exist_ok=True)

    for filename, content in DIAGRAMS.items():
        path = out_dir / filename
        path.write_text(content, encoding="utf-8")
        print(f"  dibuat: {filename}")

    print(f"\n{len(DIAGRAMS)} sequence diagram tersimpan di: {out_dir}")


if __name__ == "__main__":
    main()
