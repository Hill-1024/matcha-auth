package com.matcha.auth;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Iterator;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import okhttp3.Headers;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;
import org.json.JSONException;

@CapacitorPlugin(name = "MatchaWebDavHttp")
public class MatchaWebDavHttpPlugin extends Plugin {
    private final ExecutorService executor = Executors.newCachedThreadPool();

    @PluginMethod
    public void request(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("Missing url");
            return;
        }

        String method = call.getString("method", "GET").toUpperCase(Locale.ROOT);
        JSObject headers = call.getObject("headers", new JSObject());
        String data = call.getString("data", null);
        int connectTimeout = call.getInt("connectTimeout", 15000);
        int readTimeout = call.getInt("readTimeout", 30000);

        executor.execute(() -> executeRequest(call, url, method, headers, data, connectTimeout, readTimeout));
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        executor.shutdownNow();
    }

    private void executeRequest(
        PluginCall call,
        String url,
        String method,
        JSObject headers,
        String data,
        int connectTimeout,
        int readTimeout
    ) {
        try {
            OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(connectTimeout, java.util.concurrent.TimeUnit.MILLISECONDS)
                .readTimeout(readTimeout, java.util.concurrent.TimeUnit.MILLISECONDS)
                .build();

            RequestBody body = buildRequestBody(method, headers, data);
            Request.Builder requestBuilder = new Request.Builder().url(url).method(method, body);
            applyHeaders(requestBuilder, headers);

            try (Response response = client.newCall(requestBuilder.build()).execute()) {
                JSObject result = new JSObject();
                result.put("status", response.code());
                result.put("headers", toJsHeaders(response.headers()));
                result.put("url", response.request().url().toString());

                ResponseBody responseBody = response.body();
                result.put("data", responseBody == null ? "" : responseBody.string());
                call.resolve(result);
            }
        } catch (Exception error) {
            call.reject(error.getMessage(), error);
        }
    }

    private RequestBody buildRequestBody(String method, JSObject headers, String data) {
        if (method.equals("GET") || method.equals("HEAD")) {
            return null;
        }

        if (data == null && !requiresRequestBody(method)) {
            return null;
        }

        String contentType = getHeader(headers, "Content-Type");
        MediaType mediaType = MediaType.parse(contentType == null ? "application/octet-stream" : contentType);
        return RequestBody.create(data == null ? "" : data, mediaType);
    }

    private boolean requiresRequestBody(String method) {
        return method.equals("POST") || method.equals("PUT") || method.equals("PATCH") || method.equals("PROPPATCH") || method.equals("REPORT");
    }

    private void applyHeaders(Request.Builder requestBuilder, JSObject headers) throws JSONException {
        Iterator<String> keys = headers.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            String value = headers.getString(key);
            if (value != null) {
                requestBuilder.header(key, value);
            }
        }
    }

    private JSObject toJsHeaders(Headers headers) {
        JSObject output = new JSObject();
        for (String name : headers.names()) {
            output.put(name, joinHeaderValues(headers.values(name)));
        }
        return output;
    }

    private String joinHeaderValues(java.util.List<String> values) {
        StringBuilder joined = new StringBuilder();
        for (int index = 0; index < values.size(); index += 1) {
            if (index > 0) {
                joined.append(", ");
            }
            joined.append(values.get(index));
        }
        return joined.toString();
    }

    private String getHeader(JSObject headers, String headerName) {
        Iterator<String> keys = headers.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            if (key.equalsIgnoreCase(headerName)) {
                return headers.getString(key);
            }
        }
        return null;
    }
}
