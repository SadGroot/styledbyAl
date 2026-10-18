"""Serialize the small set of operations that stop or restart the application."""
import contextlib
import fcntl

@contextlib.contextmanager
def app_lock():
    with open('/var/lib/styledbyal/.lifecycle.lock', 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        yield
