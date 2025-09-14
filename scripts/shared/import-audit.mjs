/**
 * Import Audit Trail System
 *
 * Comprehensive auditing system for all gemstone import operations.
 * Tracks every action, error, and decision made during imports.
 *
 * Features:
 * - Complete operation logging
 * - Error tracking and recovery
 * - Performance monitoring
 * - Compliance and traceability
 * - Automated report generation
 *
 * @author Crystallique Team
 * @version 1.0.0
 * @date 2025-01-19
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Import Audit Logger
 */
export class ImportAuditLogger {
  constructor(sessionId, options = {}) {
    this.sessionId = sessionId;
    this.options = {
      logToFile: true,
      logToDatabase: true,
      enableRealTime: false,
      logLevel: "info", // debug, info, warn, error
      ...options,
    };

    this.auditLog = [];
    this.sessionStart = new Date().toISOString();
    this.sessionMetadata = {
      script: null,
      version: null,
      user: null,
      command: null,
      source: null,
    };

    this.performanceMetrics = {
      startTime: Date.now(),
      operations: 0,
      errors: 0,
      warnings: 0,
      filesProcessed: 0,
      dataProcessed: 0,
    };
  }

  /**
   * Initialize audit session
   */
  async initialize(metadata = {}) {
    this.sessionMetadata = { ...this.sessionMetadata, ...metadata };

    // Create audit session record
    if (this.options.logToDatabase) {
      try {
        const { error } = await supabase.from("audit_sessions").insert({
          id: this.sessionId,
          session_type: "import_audit",
          started_at: this.sessionStart,
          metadata: this.sessionMetadata,
          status: "active",
        });

        if (error) {
          console.warn("⚠️ Failed to create audit session:", error.message);
        }
      } catch (err) {
        console.warn("⚠️ Audit session creation failed:", err.message);
      }
    }

    this.log("session_started", "Audit session initialized", {
      sessionId: this.sessionId,
      metadata: this.sessionMetadata,
    });

    return this;
  }

  /**
   * Log an audit event
   */
  log(event, message, data = {}, level = "info") {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      event,
      level,
      message,
      data,
      performance: this.getCurrentPerformance(),
    };

    this.auditLog.push(auditEntry);
    this.performanceMetrics.operations++;

    // Log to console based on level
    const prefix = this.getLogPrefix(level);
    console.log(`${prefix} ${event}: ${message}`, data);

    // Log to database if enabled
    if (this.options.logToDatabase && this.shouldLogToDatabase(level)) {
      this.logToDatabase(auditEntry).catch((err) =>
        console.warn("⚠️ Failed to log to database:", err.message)
      );
    }

    return this;
  }

  /**
   * Log operation start
   */
  logOperationStart(operation, context = {}) {
    return this.log("operation_started", `Starting ${operation}`, {
      operation,
      ...context,
    });
  }

  /**
   * Log operation completion
   */
  logOperationComplete(operation, result = {}, context = {}) {
    const duration = context.duration || 0;
    return this.log("operation_completed", `Completed ${operation}`, {
      operation,
      result,
      duration,
      ...context,
    });
  }

  /**
   * Log error
   */
  logError(error, context = {}, operation = null) {
    this.performanceMetrics.errors++;

    return this.log(
      "error",
      error.message,
      {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        operation,
        ...context,
      },
      "error"
    );
  }

  /**
   * Log warning
   */
  logWarning(message, context = {}) {
    this.performanceMetrics.warnings++;

    return this.log("warning", message, context, "warn");
  }

  /**
   * Log file processing
   */
  logFileProcessed(filename, size, result, operation = "file_processing") {
    this.performanceMetrics.filesProcessed++;

    return this.log("file_processed", `Processed ${filename}`, {
      filename,
      size,
      result,
      operation,
    });
  }

  /**
   * Log data processing
   */
  logDataProcessed(table, count, operation = "data_processing") {
    this.performanceMetrics.dataProcessed += count;

    return this.log(
      "data_processed",
      `Processed ${count} records for ${table}`,
      {
        table,
        count,
        operation,
      }
    );
  }

  /**
   * Log security event
   */
  logSecurity(event, details = {}) {
    return this.log("security_event", event, details, "warn");
  }

  /**
   * Log performance metric
   */
  logPerformance(metric, value, context = {}) {
    return this.log("performance_metric", `Performance: ${metric} = ${value}`, {
      metric,
      value,
      ...context,
    });
  }

  /**
   * Complete audit session
   */
  async complete(success = true, finalStats = {}) {
    const endTime = new Date().toISOString();
    const duration = Date.now() - this.performanceMetrics.startTime;

    this.performanceMetrics = { ...this.performanceMetrics, ...finalStats };

    const summary = {
      sessionId: this.sessionId,
      success,
      duration,
      operations: this.performanceMetrics.operations,
      errors: this.performanceMetrics.errors,
      warnings: this.performanceMetrics.warnings,
      filesProcessed: this.performanceMetrics.filesProcessed,
      dataProcessed: this.performanceMetrics.dataProcessed,
      startTime: this.sessionStart,
      endTime,
      metadata: this.sessionMetadata,
    };

    // Log completion
    this.log(
      "session_completed",
      `Audit session ${success ? "completed" : "failed"}`,
      summary
    );

    // Update database session
    if (this.options.logToDatabase) {
      try {
        const { error } = await supabase
          .from("audit_sessions")
          .update({
            completed_at: endTime,
            status: success ? "completed" : "failed",
            summary,
            audit_log: this.auditLog.slice(-100), // Last 100 entries
          })
          .eq("id", this.sessionId);

        if (error) {
          console.warn("⚠️ Failed to update audit session:", error.message);
        }
      } catch (err) {
        console.warn("⚠️ Audit session update failed:", err.message);
      }
    }

    // Write to file if enabled
    if (this.options.logToFile) {
      await this.writeAuditLogToFile(summary);
    }

    return summary;
  }

  /**
   * Generate audit report
   */
  generateReport() {
    const duration = Date.now() - this.performanceMetrics.startTime;

    return {
      session: {
        id: this.sessionId,
        startTime: this.sessionStart,
        duration,
        metadata: this.sessionMetadata,
      },
      performance: {
        ...this.performanceMetrics,
        duration,
        operationsPerSecond:
          duration > 0
            ? this.performanceMetrics.operations / (duration / 1000)
            : 0,
        errorRate:
          this.performanceMetrics.operations > 0
            ? (this.performanceMetrics.errors /
                this.performanceMetrics.operations) *
              100
            : 0,
      },
      events: {
        total: this.auditLog.length,
        byLevel: this.getEventCountByLevel(),
        recent: this.auditLog.slice(-10),
      },
      summary: {
        success: this.performanceMetrics.errors === 0,
        totalOperations: this.performanceMetrics.operations,
        totalErrors: this.performanceMetrics.errors,
        totalWarnings: this.performanceMetrics.warnings,
      },
    };
  }

  /**
   * Get current performance metrics
   */
  getCurrentPerformance() {
    const duration = Date.now() - this.performanceMetrics.startTime;

    return {
      duration,
      operations: this.performanceMetrics.operations,
      operationsPerSecond:
        duration > 0
          ? this.performanceMetrics.operations / (duration / 1000)
          : 0,
      errorRate:
        this.performanceMetrics.operations > 0
          ? (this.performanceMetrics.errors /
              this.performanceMetrics.operations) *
            100
          : 0,
    };
  }

  /**
   * Get event count by level
   */
  getEventCountByLevel() {
    return this.auditLog.reduce((acc, entry) => {
      acc[entry.level] = (acc[entry.level] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Get log prefix for console output
   */
  getLogPrefix(level) {
    const prefixes = {
      debug: "🔍",
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
    };
    return prefixes[level] || "📝";
  }

  /**
   * Check if should log to database based on level
   */
  shouldLogToDatabase(level) {
    const levels = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.options.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Log entry to database
   */
  async logToDatabase(entry) {
    try {
      const { error } = await supabase.from("audit_log").insert({
        session_id: entry.sessionId,
        event_type: entry.event,
        level: entry.level,
        message: entry.message,
        data: entry.data,
        performance_data: entry.performance,
        created_at: entry.timestamp,
      });

      if (error) {
        console.warn("⚠️ Database audit log failed:", error.message);
      }
    } catch (err) {
      console.warn("⚠️ Database audit log error:", err.message);
    }
  }

  /**
   * Write audit log to file
   */
  async writeAuditLogToFile(summary) {
    try {
      const logDir = path.join(process.cwd(), "logs", "audit");
      await fs.mkdir(logDir, { recursive: true });

      const filename = `audit-${this.sessionId}-${
        new Date().toISOString().split("T")[0]
      }.json`;
      const filePath = path.join(logDir, filename);

      const auditData = {
        summary,
        fullLog: this.auditLog,
        metadata: {
          generatedAt: new Date().toISOString(),
          script: this.sessionMetadata.script,
          version: this.sessionMetadata.version,
        },
      };

      await fs.writeFile(filePath, JSON.stringify(auditData, null, 2));
      console.log(`📝 Audit log written to: ${filePath}`);
    } catch (error) {
      console.warn("⚠️ Failed to write audit log to file:", error.message);
    }
  }
}

/**
 * Create audit logger instance
 */
export function createAuditLogger(sessionId, options = {}) {
  return new ImportAuditLogger(sessionId, options);
}

/**
 * Get audit sessions
 */
export async function getAuditSessions(limit = 50, status = null) {
  try {
    let query = supabase
      .from("audit_sessions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Failed to get audit sessions:", error.message);
    return [];
  }
}

/**
 * Get audit log for session
 */
export async function getAuditLog(sessionId, limit = 100) {
  try {
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Failed to get audit log:", error.message);
    return [];
  }
}

/**
 * Generate compliance report
 */
export async function generateComplianceReport(sessionId) {
  try {
    const session = await getAuditSessions(1, null).then((sessions) =>
      sessions.find((s) => s.id === sessionId)
    );

    const auditLog = await getAuditLog(sessionId, 1000);

    if (!session) {
      throw new Error("Session not found");
    }

    const errors = auditLog.filter((entry) => entry.level === "error");
    const warnings = auditLog.filter((entry) => entry.level === "warn");
    const securityEvents = auditLog.filter(
      (entry) => entry.event_type === "security_event"
    );

    return {
      sessionId,
      compliance: {
        hasErrors: errors.length > 0,
        hasWarnings: warnings.length > 0,
        hasSecurityEvents: securityEvents.length > 0,
        errorCount: errors.length,
        warningCount: warnings.length,
        securityEventCount: securityEvents.length,
      },
      summary: {
        totalEvents: auditLog.length,
        successRate:
          errors.length === 0
            ? 100
            : ((auditLog.length - errors.length) / auditLog.length) * 100,
        sessionDuration: session.completed_at
          ? new Date(session.completed_at).getTime() -
            new Date(session.started_at).getTime()
          : null,
      },
      issues: {
        errors: errors.slice(0, 10),
        warnings: warnings.slice(0, 10),
        securityEvents: securityEvents.slice(0, 10),
      },
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Failed to generate compliance report:", error.message);
    return null;
  }
}

/**
 * Clean up old audit logs
 */
export async function cleanupOldAuditLogs(daysOld = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Delete old audit log entries
    const { data: logDeleted, error: logError } = await supabase
      .from("audit_log")
      .delete()
      .lt("created_at", cutoffDate.toISOString());

    // Delete old audit sessions
    const { data: sessionDeleted, error: sessionError } = await supabase
      .from("audit_sessions")
      .delete()
      .lt("started_at", cutoffDate.toISOString())
      .neq("status", "active");

    const totalDeleted =
      (logDeleted?.length || 0) + (sessionDeleted?.length || 0);

    console.log(`🗑️ Cleaned up ${totalDeleted} old audit records`);
    return totalDeleted;
  } catch (error) {
    console.error("❌ Failed to cleanup audit logs:", error.message);
    return 0;
  }
}
