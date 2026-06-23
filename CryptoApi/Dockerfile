# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["CryptoApi.csproj", "."]
RUN dotnet restore "CryptoApi.csproj"

COPY . .
RUN dotnet build "CryptoApi.csproj" -c Release -o /app/build

RUN dotnet publish "CryptoApi.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "CryptoApi.dll"]