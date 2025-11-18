class Debouncer {
  constructor(delay) {
    this.delay = delay;
    this.timeoutId = null;
    this.isLocked = false;
    this.pendingExecution = null;
  }

  // 触发执行，但会等待延迟
  trigger(func) {
    // 如果有正在等待的，先取消
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // 如果被锁定，则将函数暂存起来
    if (this.isLocked) {
      this.pendingExecution = func;
      console.log('⏳ Debouncer is locked. Execution is pending.');
      return;
    }

    // 设置新的超时
    this.timeoutId = setTimeout(() => {
      func();
      this.timeoutId = null;
    }, this.delay);
  }

  // 锁定，防止在关键操作期间执行
  lock() {
    this.isLocked = true;
    console.log('🔒 Debouncer locked.');
  }

  // 解锁，并执行任何挂起的操作
  unlock() {
    this.isLocked = false;
    console.log('🔓 Debouncer unlocked.');
    if (this.pendingExecution) {
      console.log('🚀 Executing pending function after unlock.');
      const funcToRun = this.pendingExecution;
      this.pendingExecution = null;
      this.trigger(funcToRun);
    }
  }
}

module.exports = Debouncer;
