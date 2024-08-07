<template>
    <div class="login">
        <div class="tittle">
            teste
        </div>
        <form @submit.prevent="login">
            <div class="input-group">
                <label for="publicKey">Chave Pública</label>
                <input type="text" v-model="publicKey" required />
            </div>
            <div class="input-group">
                <label for="privateKey">Chave Privada</label>
                <input type="password" v-model="privateKey" required />
            </div>
            <div class="input-group">
                <label for="network">Network</label>
                <div class="custom-select">
                    <select v-model="network">
                        <option value="mainnet">Mainnet</option>
                        <option value="ropsten">Ropsten</option>
                        <option value="ganache">Ganache</option>
                    </select>
                </div>
            </div>
            <button type="submit">Login</button>
        </form>
    </div>
</template>

