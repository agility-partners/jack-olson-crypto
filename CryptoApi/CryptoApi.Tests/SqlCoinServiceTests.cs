using System.Collections;
using System.Data;
using System.Data.Common;
using FluentAssertions;
using CryptoApi.Services;
using Xunit;

namespace CryptoApi.Tests;

public class SqlCoinServiceTests
{
    [Fact]
    public async Task GetAllCoinsAsync_MapsLiveSqlRows()
    {
        var service = CreateService(
            CreateReader(
                ("bitcoin", "btc", "Bitcoin", 1, 70000.12m, 1_350_000_000_000m, 31_200_000_000m, 3.45m),
                ("ethereum", "eth", "Ethereum", 2, 3800.50m, 450_000_000_000m, 18_000_000_000m, -1.25m),
                ("unknown-coin", "???", "Unknown", 99, 1.23m, 10m, 2m, 0.1m)
            ));

        var coins = (await service.GetAllCoinsAsync()).ToList();

        coins.Should().HaveCount(2);
        coins[0].Id.Should().Be("bitcoin");
        coins[0].IconClass.Should().Be("btc");
        coins[0].MarketCap.Should().Be("$1.35T");
        coins[0].Volume.Should().Be("$31.2B");
        coins[0].Change24h.Should().Be(3.45m);
        coins[1].Id.Should().Be("ethereum");
    }

    [Fact]
    public async Task GetAllCoinsAsync_FallsBackToCatalogWhenSqlReturnsNoSupportedRows()
    {
        var service = CreateService(CreateReader());

        var coins = (await service.GetAllCoinsAsync()).ToList();

        coins.Should().HaveCount(32);
        coins.Should().Contain(c => c.Id == "optimism");
    }

    [Fact]
    public async Task GetCoinByIdAsync_FallsBackToCatalogWhenCoinMissingFromSql()
    {
        var service = CreateService(CreateReader());

        var coin = await service.GetCoinByIdAsync("optimism");

        coin.Should().NotBeNull();
        coin!.Symbol.Should().Be("OP");
        coin.IconClass.Should().Be("op");
    }

    private static SqlCoinService CreateService(DbDataReader reader) =>
        new(() => new FakeDbConnection(reader));

    private static DbDataReader CreateReader(params (string CoinId, string Symbol, string Name, int Rank, decimal Price, decimal MarketCap, decimal Volume, decimal Change24h)[] rows)
    {
        var table = new DataTable();
        table.Columns.Add("coin_id", typeof(string));
        table.Columns.Add("symbol", typeof(string));
        table.Columns.Add("name", typeof(string));
        table.Columns.Add("market_cap_rank", typeof(int));
        table.Columns.Add("current_price", typeof(decimal));
        table.Columns.Add("market_cap", typeof(decimal));
        table.Columns.Add("total_volume", typeof(decimal));
        table.Columns.Add("price_change_percentage_24h", typeof(decimal));

        foreach (var row in rows)
        {
            table.Rows.Add(row.CoinId, row.Symbol, row.Name, row.Rank, row.Price, row.MarketCap, row.Volume, row.Change24h);
        }

        return table.CreateDataReader();
    }

    private sealed class FakeDbConnection : DbConnection
    {
        private readonly DbDataReader _reader;

        public FakeDbConnection(DbDataReader reader)
        {
            _reader = reader;
        }

        public override string ConnectionString { get; set; } = string.Empty;
        public override string Database => "crypto_data";
        public override string DataSource => "fake";
        public override string ServerVersion => "1.0";
        public override ConnectionState State => ConnectionState.Open;

        public override void ChangeDatabase(string databaseName) { }
        public override void Close() { }
        public override void Open() { }
        protected override DbTransaction BeginDbTransaction(IsolationLevel isolationLevel) => throw new NotSupportedException();
        protected override DbCommand CreateDbCommand() => new FakeDbCommand(_reader);
        public override Task OpenAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class FakeDbCommand : DbCommand
    {
        private readonly DbDataReader _reader;
        private readonly FakeDbParameterCollection _parameters = new();

        public FakeDbCommand(DbDataReader reader)
        {
            _reader = reader;
        }

        public override string CommandText { get; set; } = string.Empty;
        public override int CommandTimeout { get; set; }
        public override CommandType CommandType { get; set; }
        public override bool DesignTimeVisible { get; set; }
        public override UpdateRowSource UpdatedRowSource { get; set; }
        protected override DbConnection? DbConnection { get; set; }
        protected override DbParameterCollection DbParameterCollection => _parameters;
        protected override DbTransaction? DbTransaction { get; set; }

        public override void Cancel() { }
        public override int ExecuteNonQuery() => throw new NotSupportedException();
        public override object? ExecuteScalar() => throw new NotSupportedException();
        public override void Prepare() { }
        protected override DbParameter CreateDbParameter() => new FakeDbParameter();
        protected override DbDataReader ExecuteDbDataReader(CommandBehavior behavior) => _reader;
    }

    private sealed class FakeDbParameter : DbParameter
    {
        public override DbType DbType { get; set; }
        public override ParameterDirection Direction { get; set; } = ParameterDirection.Input;
        public override bool IsNullable { get; set; }
        public override string ParameterName { get; set; } = string.Empty;
        public override string SourceColumn { get; set; } = string.Empty;
        public override object? Value { get; set; }
        public override bool SourceColumnNullMapping { get; set; }
        public override int Size { get; set; }
        public override void ResetDbType() { }
    }

    private sealed class FakeDbParameterCollection : DbParameterCollection
    {
        private readonly List<DbParameter> _parameters = [];

        public override int Count => _parameters.Count;
        public override object SyncRoot => new();
        public override int Add(object value)
        {
            _parameters.Add((DbParameter)value);
            return _parameters.Count - 1;
        }

        public override void AddRange(Array values)
        {
            foreach (var value in values)
            {
                Add(value!);
            }
        }

        public override void Clear() => _parameters.Clear();
        public override bool Contains(object value) => _parameters.Contains((DbParameter)value);
        public override bool Contains(string value) => _parameters.Any(parameter => parameter.ParameterName == value);
        public override void CopyTo(Array array, int index) => ((ICollection)_parameters).CopyTo(array, index);
        public override IEnumerator GetEnumerator() => _parameters.GetEnumerator();
        public override int IndexOf(object value) => _parameters.IndexOf((DbParameter)value);
        public override int IndexOf(string parameterName) => _parameters.FindIndex(parameter => parameter.ParameterName == parameterName);
        public override void Insert(int index, object value) => _parameters.Insert(index, (DbParameter)value);
        public override void Remove(object value) => _parameters.Remove((DbParameter)value);
        public override void RemoveAt(int index) => _parameters.RemoveAt(index);
        public override void RemoveAt(string parameterName)
        {
            var index = IndexOf(parameterName);
            if (index >= 0)
            {
                RemoveAt(index);
            }
        }

        protected override DbParameter GetParameter(int index) => _parameters[index];
        protected override DbParameter GetParameter(string parameterName) => _parameters[IndexOf(parameterName)];
        protected override void SetParameter(int index, DbParameter value) => _parameters[index] = value;
        protected override void SetParameter(string parameterName, DbParameter value)
        {
            var index = IndexOf(parameterName);
            if (index >= 0)
            {
                _parameters[index] = value;
            }
            else
            {
                _parameters.Add(value);
            }
        }
    }
}
