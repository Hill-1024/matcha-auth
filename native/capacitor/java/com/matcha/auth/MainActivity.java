package com.matcha.auth;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(MatchaWebDavHttpPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
