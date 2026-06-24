# CryptoApi Unit Tests

Unit tests for the CryptoApi service layer using **xUnit**, **Moq**, and **FluentAssertions**.

## Setup

### Install Dependencies
Dependencies are already defined in `CryptoApi.Tests.csproj`:
- **xUnit** — Test framework
- **Moq** — Mocking library for isolating dependencies
- **FluentAssertions** — Readable assertion syntax

### Run Tests

```bash
# Run all tests
dotnet test CryptoApi.Tests/CryptoApi.Tests.csproj

# Run with verbose output
dotnet test CryptoApi.Tests/CryptoApi.Tests.csproj --verbosity detailed

# Run a specific test class
dotnet test CryptoApi.Tests/CryptoApi.Tests.csproj --filter "ClassName=CoinServiceTests"

# Run with coverage
dotnet test CryptoApi.Tests/CryptoApi.Tests.csproj /p:CollectCoverage=true
```

## Test Structure (Arrange-Act-Assert)

Every test follows this pattern:

```csharp
[Fact]
public async Task MethodName_ExpectedBehavior_GivenCondition()
{
    // Arrange — Set up test data and mocks
    var mockRepository = new Mock<IRepository>();
    mockRepository.Setup(r => r.GetData()).ReturnsAsync(data);

    // Act — Call the method being tested
    var result = await service.MethodAsync();

    // Assert — Verify the outcome
    result.Should().Be(expectedValue);
}
```

## Naming Convention

Test names follow this pattern:
- **MethodName** — What you're testing
- **ExpectedBehavior** — What should happen
- **GivenCondition** — Under what circumstances

Example: `GetCoinById_ReturnsCoin_WhenCoinExists()`

## Key Patterns

### 1. Mocking with Moq

```csharp
var mockRepository = new Mock<ICoinRepository>();
mockRepository
    .Setup(repo => repo.GetCoinByIdAsync("1"))
    .ReturnsAsync(expectedCoin);
```

### 2. Fluent Assertions

```csharp
result.Should().NotBeNull();
result.Should().HaveCount(2);
result.Should().Contain(c => c.Symbol == "BTC");
```

### 3. Testing Async Methods

```csharp
[Fact]
public async Task GetCoins_ReturnsCoins()
{
    var result = await service.GetCoinsAsync();
    result.Should().NotBeEmpty();
}
```

## What to Test

✅ **Service business logic** — Add/remove watchlist, filter coins, validate input  
✅ **Edge cases** — Null, empty, duplicate entries  
✅ **Error handling** — Invalid IDs, missing data  
❌ **HTTP mechanics** — Test controllers separately with integration tests  
❌ **Database directly** — Mock repositories instead  

## File Organization

```
CryptoApi.Tests/
├── CoinServiceTests.cs
├── WatchlistServiceTests.cs
├── Fixtures/
│   └── TestData.cs (shared test data)
└── CryptoApi.Tests.csproj
```

## Next Steps

1. **Implement actual services** in CryptoApi if not done yet
2. **Write tests for each service** following the patterns in `CoinServiceTests.cs`
3. **Run tests locally** before each commit
4. **Add CI/CD** to run tests on every pull request
