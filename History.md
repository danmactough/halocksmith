
v0.0.2 / 2013-04-05
==================

  * Force no slave on read
  * Change release method to take a callback and not log to console
  * Add option to set the retry timeout
  * Update README, package.json, LICENSE
  * Use haredis instead of node-redis
  * Bail as soon as possible if we aren't supposed to retry
  * Fix bug in option parsing where valid options could be zero
  * Fix off-by-one bug in retry that caused one too many retries
  * Don't pass retries option to redis
  * Clarify code comment
