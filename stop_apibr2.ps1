# Script para parar todos os serviços do APIBR2
Write-Host "Parando serviços do APIBR2..." -ForegroundColor Yellow

function Kill-Port($port) {
    $tcp = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($tcp) {
        foreach ($conn in $tcp) {
            try {
                $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "  Matando processo $($process.ProcessName) (PID: $($conn.OwningProcess)) na porta $port" -ForegroundColor Red
                    Stop-Process -Id $conn.OwningProcess -Force
                }
            }
            catch {
                Write-Host "  Erro ao matar processo na porta ${port}: $_" -ForegroundColor Red
            }
        }
    }
    else {
        Write-Host "  Nenhum processo encontrado na porta $port" -ForegroundColor Gray
    }
}

# Parar Backend (3000)
Kill-Port 3000

# Parar Image Server (5001)
Kill-Port 5001

# Parar Instagram Server (5002)
Kill-Port 5002

# Parar Frontend (5173)
Kill-Port 5173

Write-Host "Todos os serviços foram parados." -ForegroundColor Green
