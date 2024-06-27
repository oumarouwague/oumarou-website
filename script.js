document.addEventListener('DOMContentLoaded', () => {
    const cart = [];
    const cartButtons = document.querySelectorAll('.product button');
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.querySelector('.cart-items');
    const totalPriceElement = document.getElementById('total-price');
    const checkoutButton = document.getElementById('checkout-button');
    const paymentForm = document.getElementById('payment-form');
    const paymentMessage = document.getElementById('payment-message');
    const stripe = Stripe('your-publishable-key'); // Replace with your Stripe publishable key
    const elements = stripe.elements();
    const cardElement = elements.create('card');
    cardElement.mount('#card-element');

    cartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productElement = e.target.closest('.product');
            const productName = productElement.dataset.name;
            const productPrice = parseFloat(productElement.dataset.price);
            addToCart(productName, productPrice);
        });
    });

    checkoutButton.addEventListener('click', () => {
        paymentForm.style.display = 'block';
        checkoutButton.style.display = 'none';
    });

    paymentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const totalAmount = calculateTotalPrice();

        const response = await fetch('http://localhost:3000/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount: totalAmount }),
        });

        const { clientSecret } = await response.json();

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
            },
        });

        if (error) {
            paymentMessage.textContent = error.message;
        } else {
            paymentMessage.textContent = 'Payment successful!';
            cart.length = 0;
            updateCart();
            paymentForm.style.display = 'none';
            checkoutButton.style.display = 'block';
        }
    });

    function addToCart(name, price) {
        const existingProduct = cart.find(item => item.name === name);
        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cart.push({ name, price, quantity: 1 });
        }
        updateCart();
    }

    function updateCart() {
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartItems.innerHTML = '';
        let totalPrice = 0;

        cart.forEach(item => {
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <span>${item.name} x ${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
                <button data-name="${item.name}">Remove</button>
            `;
            cartItemElement.querySelector('button').addEventListener('click', () => {
                removeFromCart(item.name);
            });
            cartItems.appendChild(cartItemElement);
            totalPrice += item.price * item.quantity;
        });

        totalPriceElement.textContent = totalPrice.toFixed(2);
    }

    function removeFromCart(name) {
        const productIndex = cart.findIndex(item => item.name === name);
        if (productIndex !== -1) {
            cart.splice(productIndex, 1);
            updateCart();
        }
    }

    function calculateTotalPrice() {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
});

