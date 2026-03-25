---
title: "Time-Series Datenbanken: Wann brauchst du sie?"
description: "Time-Series Datenbanken erklärt: Was TimescaleDB, InfluxDB und ClickHouse können, wann du sie wirklich brauchst und wann PostgreSQL ausreicht."
category: "Datenbanken"
order: 28
keywords: ["Time-Series Datenbank", "TimescaleDB", "InfluxDB", "ClickHouse", "Zeitreihendaten"]
---

## Was sind Time-Series Datenbanken?

Du sammelst Temperaturdaten alle 10 Sekunden. Oder du loggst API-Anfragen mit Timestamps. Oder du trackst Metriken deiner App über Zeit. Das sind **Zeitreihendaten**: Messungen, die einem Zeitpunkt zugeordnet sind und chronologisch wachsen.

Eine **Time-Series Database (TSDB)** ist speziell für diese Art von Daten optimiert. Sie geht davon aus:

1. Daten kommen **immer mit einem Timestamp**
2. Alte Daten werden **nicht geändert** (nur neue Daten werden hinzugefügt)
3. **Zeitbasierte Abfragen** sind die Norm (letzte Stunde, letzter Tag, Trends über Zeit)

---

## Warum reicht PostgreSQL manchmal nicht?

PostgreSQL ist eine exzellente Datenbank. Aber bei Millionen von Zeitreihen-Einträgen gibt es Performance-Probleme:

```sql
-- 100 Millionen Temperatur-Messungen in PostgreSQL
-- Diese Abfrage kann Minuten dauern:
SELECT
  DATE_TRUNC('hour', measured_at) as hour,
  AVG(temperature) as avg_temp,
  MAX(temperature) as max_temp
FROM sensor_readings
WHERE sensor_id = 'sensor_42'
  AND measured_at > NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1;
```

Mit einer TSDB dauert dieselbe Abfrage Millisekunden.

---

## TimescaleDB — PostgreSQL + Superkräfte

**TimescaleDB** ist eine PostgreSQL-Erweiterung. Das Beste: Du kannst weiterhin Standard-SQL verwenden!

```sql
-- TimescaleDB installieren
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Hypertable erstellen (automatisches Partitionierung nach Zeit)
CREATE TABLE sensor_readings (
  time        TIMESTAMPTZ NOT NULL,
  sensor_id   TEXT,
  temperature DOUBLE PRECISION,
  humidity    DOUBLE PRECISION
);

-- In Hypertable umwandeln (das ist alles!)
SELECT create_hypertable('sensor_readings', 'time');
```

TimescaleDB teilt die Tabelle automatisch in **Chunks** (Zeitblöcke) auf. Abfragen greifen nur auf relevante Chunks zu:

```sql
-- Letzte 7 Tage — PostgreSQL sucht nur in den 7 relevanten Chunks
SELECT time_bucket('1 hour', time) as bucket,
       sensor_id,
       AVG(temperature),
       MAX(humidity)
FROM sensor_readings
WHERE time > NOW() - INTERVAL '7 days'
GROUP BY bucket, sensor_id
ORDER BY bucket;
```

### TimescaleDB-Besonderheiten

```sql
-- Automatisches Aggregieren (Continuous Aggregates)
-- Berechnet stündliche Durchschnitte automatisch im Hintergrund
CREATE MATERIALIZED VIEW hourly_temps
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) as hour,
       sensor_id,
       AVG(temperature) as avg_temp
FROM sensor_readings
GROUP BY 1, 2;

-- Automatisches Löschen alter Daten (Data Retention)
SELECT add_retention_policy('sensor_readings', INTERVAL '90 days');
```

> [!NOTE]
> **Supabase** unterstützt TimescaleDB als Erweiterung. Du kannst es direkt aktivieren, wenn du Zeitreihendaten in deinem Supabase-Projekt hast.

---

## InfluxDB — speziell für Metriken

**InfluxDB** ist eine eigenständige TSDB, speziell für Monitoring und Metriken gebaut:

```
# InfluxDB Line Protocol — sehr kompakt
cpu,host=server01,region=eu temperature=65.5 1710000000000000000
cpu,host=server01,region=eu temperature=66.2 1710000010000000000
memory,host=server01 used_bytes=4294967296 1710000000000000000
```

InfluxDB hat eine eigene Query-Sprache (Flux):

```flux
from(bucket: "monitoring")
  |> range(start: -1h)
  |> filter(fn: (r) => r.measurement == "cpu")
  |> filter(fn: (r) => r.host == "server01")
  |> aggregateWindow(every: 5m, fn: mean)
  |> yield(name: "mean_cpu")
```

**Gut für:** System-Monitoring, IoT-Metriken, Infrastruktur-Observability

---

## ClickHouse — für analytische Workloads

**ClickHouse** ist eine spaltenorientierte Datenbank, ideal für Big Data Analytics:

```sql
-- ClickHouse kann Milliarden Zeilen in Sekunden aggregieren
SELECT
  toStartOfDay(event_time) as day,
  event_type,
  count() as event_count,
  uniqExact(user_id) as unique_users
FROM events
WHERE event_time BETWEEN '2024-01-01' AND '2024-03-31'
GROUP BY day, event_type
ORDER BY day, event_count DESC;
```

ClickHouse ist extrem schnell für lesezentrierte Analytik, aber nicht für häufige Updates oder Transaktionen geeignet.

**Gut für:** Analytics, Logging, Business Intelligence bei großen Datenmengen

---

## Wann brauchst du eine TSDB?

### Ja, wenn...

- Du **Millionen+ Datenpunkte pro Tag** sammelst
- **Zeitbasierte Aggregationen** die häufigste Abfrage sind (stündlich, täglich, wöchentlich)
- Du **Data Retention** brauchst (alte Daten automatisch löschen/komprimieren)
- Du **IoT-Sensor-Daten, Metriken oder Logs** in großen Mengen speicherst

### PostgreSQL reicht, wenn...

- Du **weniger als 1 Million Einträge** pro Monat hast
- Zeitreihen nur **ein Teil** deiner Daten sind (nicht der Kern)
- Du **einfache Zeitstempel** an normale Objekte hängen willst (z. B. `created_at`)
- Du TimescaleDB hinzufügst (dann bleibst du bei PostgreSQL)

> [!IMPORTANT]
> Für die meisten Web-Apps sind echte Time-Series Datenbanken überdimensioniert. Wenn du nur `created_at`-Felder hast und Daten nach Datum filterst, reicht PostgreSQL mit guten Indizes problemlos.

---

## Vergleich: Welche TSDB für welchen Use Case?

| Use Case | Empfehlung |
|---|---|
| Web-App mit Zeitstempeln | PostgreSQL reicht |
| Wachsende Metriken + noch PostgreSQL nutzen | TimescaleDB |
| System-Monitoring, IoT | InfluxDB |
| Business Analytics, Logs (Milliarden Zeilen) | ClickHouse |
| Serverless, einfach starten | TimescaleDB auf Supabase |

---

## Praktisches Beispiel: API-Metriken tracken

```typescript
// Mit TimescaleDB + Supabase
async function recordApiCall(endpoint: string, duration: number, statusCode: number) {
  await supabase.from('api_metrics').insert({
    time: new Date().toISOString(),
    endpoint,
    duration_ms: duration,
    status_code: statusCode,
  });
}

// Stündlicher Durchschnitt der letzten 24 Stunden
const { data } = await supabase.rpc('get_hourly_api_stats', {
  start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
});
```

---

## Wie Venator dir hilft

Wenn du Venator beschreibst, dass du Echtzeit-Metriken, Sensor-Daten oder umfangreiche Event-Logs speichern möchtest, empfiehlt die Plattform die passende Lösung — von "PostgreSQL reicht" bis hin zu spezialisierten TSDBs wie TimescaleDB oder ClickHouse.

## Weiterführende Artikel

- [Datenbankindexierung erklärt](/learn/datenbank-indexierung)
- [Redis: Wann und wie einsetzen?](/learn/redis-use-cases)
- [Monitoring und Logging für Einsteiger](/learn/monitoring-logging)
