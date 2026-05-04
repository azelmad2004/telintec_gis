<?php
namespace App\Http;
use Illuminate\Foundation\Http\Kernel as HttpKernel;
class Kernel extends HttpKernel {
    protected $middleware = [ \Illuminate\Http\Middleware\HandleCors::class, \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class, \App\Http\Middleware\TrimStrings::class, \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class ];
    protected $middlewareGroups = [ 'web' => [ \App\Http\Middleware\EncryptCookies::class, \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class, \Illuminate\Session\Middleware\StartSession::class, \Illuminate\View\Middleware\ShareErrorsFromSession::class, \App\Http\Middleware\VerifyCsrfToken::class, \Illuminate\Routing\Middleware\SubstituteBindings::class ], 'api' => [ 'throttle:api', \Illuminate\Routing\Middleware\SubstituteBindings::class ] ];
    protected $routeMiddleware = [ 'auth' => \Illuminate\Auth\Middleware\Authenticate::class ];
}

namespace App\Console;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
class Kernel extends ConsoleKernel {
    protected function schedule($schedule) {}
    protected function commands() { require base_path('Routes.php'); }
}

namespace App\Exceptions;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
class Handler extends ExceptionHandler {
    protected $dontReport = [];
    protected $dontFlash = [ 'current_password', 'password', 'password_confirmation' ];
    public function register() { $this->reportable(function (\Throwable $e) {}); }
}

namespace App\Http\Middleware;
use Illuminate\Foundation\Http\Middleware\TrimStrings as Middleware;
class TrimStrings extends Middleware { protected $except = [ 'current_password', 'password', 'password_confirmation' ]; }

namespace App\Http\Middleware;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;
class VerifyCsrfToken extends Middleware { protected $except = []; }

namespace App\Http\Middleware;
use Illuminate\Http\Middleware\TrustProxies as Middleware;
use Illuminate\Http\Request;
class TrustProxies extends Middleware { protected $proxies; protected $headers = Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_HOST | Request::HEADER_X_FORWARDED_PORT | Request::HEADER_X_FORWARDED_PROTO | Request::HEADER_X_FORWARDED_AWS_ELB; }
