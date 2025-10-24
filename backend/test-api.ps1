# Test Registration API with PowerShell

Write-Host "🧪 Testing Registration API..." -ForegroundColor Cyan

$testUsers = @(
    @{
        name = "Albert"
        email = "albert@gmail.com"  
        password = "1234123456"
        phone = "123456789"
        location = "Chennai"
    },
    @{
        name = "Sarah Wilson"
        email = "sarah.wilson@email.com"
        password = "password123"
        phone = "9876543210"
        location = "Mumbai"
    }
)

foreach ($user in $testUsers) {
    Write-Host "`nTesting: $($user.name) ($($user.email))" -ForegroundColor Yellow
    
    $body = $user | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body $body
        Write-Host "✅ Registration successful" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Green
    }
    catch {
        $errorResponse = $_.Exception.Response
        if ($errorResponse) {
            $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Status Code: $($errorResponse.StatusCode)" -ForegroundColor Red
            Write-Host "Response: $responseBody" -ForegroundColor Red
            
            if ($errorResponse.StatusCode -eq 409) {
                Write-Host "⚠️  Email already exists" -ForegroundColor Orange
            }
        } else {
            Write-Host "❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host "---"
}

# Test Login
Write-Host "`n🧪 Testing Login API..." -ForegroundColor Cyan

$loginData = @{
    email = $testUsers[0].email
    password = $testUsers[0].password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginData
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "Response: $($loginResponse | ConvertTo-Json)" -ForegroundColor Green
    
    # Test /auth/me endpoint
    if ($loginResponse.token) {
        Write-Host "`n🧪 Testing /auth/me endpoint..." -ForegroundColor Cyan
        $headers = @{
            'Authorization' = "Bearer $($loginResponse.token)"
        }
        
        $meResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method GET -Headers $headers
        Write-Host "✅ /auth/me successful" -ForegroundColor Green
        Write-Host "Response: $($meResponse | ConvertTo-Json)" -ForegroundColor Green
    }
}
catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
        $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Status Code: $($errorResponse.StatusCode)" -ForegroundColor Red
        Write-Host "Response: $responseBody" -ForegroundColor Red
    } else {
        Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
